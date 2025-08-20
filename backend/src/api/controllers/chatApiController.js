const prisma = require("../../utils/prisma");
const cloudinary = require("../../../cloudinary");
const { ensureMember, privateKey } = require("../../utils/chatUtils");

const getAllChats = async (req, res) => {
  const userId = Number(req.user.userId);

  try {
    const chats = await prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            text: true,
            imageUrl: true,
            createdAt: true,
            fromId: true,
            edited: true,
            read: true,
          },
        },
      },
    });

    const chatIds = chats.map((c) => c.id);

    const unreadByChat = await prisma.message.groupBy({
      by: ["chatId"],
      where: { chatId: { in: chatIds }, read: false, fromId: { not: userId } },
      _count: { _all: true },
    });
    const unreadMap = new Map(
      unreadByChat.map((r) => [r.chatId, r._count._all])
    );

    const result = chats.map((chat) => {
      const lastMessage = chat.messages[0] || null;
      return {
        id: chat.id,
        type: chat.type,
        title: chat.title,
        avatarUrl: chat.avatarUrl ?? null,
        participants: chat.participants.map((p) => ({
          id: p.user.id,
          username: p.user.username,
          avatarUrl: p.user.avatarUrl ?? null,
        })),
        lastMessage,
        unreadCount: unreadMap.get(chat.id) || 0,
      };
    });

    result.sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt || 0) -
        new Date(a.lastMessage?.createdAt || 0)
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "failed to load chats" });
  }
};

const getChat = async (req, res) => {
  try {
    const chatId = Number(req.params.chatId);
    const userId = Number(req.user.userId);
    if (!chatId) {
      return res.status(400).json({ message: "invalid chatId" });
    }

    await ensureMember(chatId, userId);

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            text: true,
            imageUrl: true,
            createdAt: true,
            fromId: true,
            edited: true,
            read: true,
          },
        },
      },
    });

    if (!chat) return res.status(404).json({ message: "chat not found" });

    const unreadCount = await prisma.message.count({
      where: {
        chatId,
        read: false,
        fromId: { not: userId },
      },
    });

    const lastMessage = chat.messages[0] || null;

    const result = {
      id: chat.id,
      type: chat.type,
      title: chat.title,
      avatarUrl: chat.avatarUrl ?? null,
      avatarPublicId: chat.avatarPublicId ?? null,
      participants: chat.participants.map((p) => ({
        id: p.user.id,
        username: p.user.username,
        avatarUrl: p.user.avatarUrl ?? null,
      })),
      lastMessage,
      unreadCount,
    };

    return res.json({ chat: result });
  } catch (err) {
    console.error("getChat failed:", err);
    return res
      .status(err.status || 500)
      .json({ message: err.message || "failed to load chat" });
  }
};

// body: { type: 'DIRECT'|'GROUP', peerId? (for direct), title? (for group), participantIds? (for group) }
const createChat = async (req, res) => {
  const userId = Number(req.user.userId);
  const { type, peerId, title, participantIds } = req.body;

  try {
    if (type === "DIRECT") {
      const pid = Number(peerId);
      if (!pid) return res.status(400).json({ message: "peerId required" });
      if (pid === userId)
        return res
          .status(400)
          .json({ message: "cannot create direct chat with yourself" });

      const [u1, u2] = privateKey(userId, pid).split(":").map(Number);

      let created = false;
      let chat = await prisma.chat.findFirst({
        where: {
          type: "DIRECT",
          participants: { some: { userId: u1 } },
          AND: { participants: { some: { userId: u2 } } },
        },
        select: { id: true },
      });
      if (!chat) {
        created = true;
        chat = await prisma.chat.create({
          data: {
            type: "DIRECT",
            participants: { create: [{ userId: u1 }, { userId: u2 }] },
          },
          select: { id: true },
        });
      }
      return res.status(created ? 201 : 200).json({ id: chat.id });
    }

    if (type === "GROUP") {
      const ids = Array.from(new Set([userId, ...(participantIds || [])])).map(
        Number
      );
      if (!title || !title.trim())
        return res.status(400).json({ message: "title required" });
      if (ids.length < 2)
        return res
          .status(400)
          .json({ message: "group must have at least 2 participants" });

      const chat = await prisma.chat.create({
        data: {
          type: "GROUP",
          title: title.trim(),
          participants: { create: ids.map((id) => ({ userId: id })) },
        },
        select: { id: true },
      });
      return res.status(201).json({ id: chat.id });
    }

    return res.status(400).json({ message: "invalid chat type" });
  } catch (err) {
    res.status(500).json({ message: err.message || "failed to create chat" });
  }
};

const updateChat = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const chatId = Number(req.params.chatId);
    const { newTitle, title, avatarUrl, avatarPublicId } = req.body || {};

    await ensureMember(chatId, userId);

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, type: true, title: true, avatarPublicId: true },
    });
    if (!chat) return res.status(404).json({ error: "chat not found" });
    if (String(chat.type).toUpperCase() !== "GROUP") {
      return res.status(400).json({ error: "cannot edit DIRECT chat" });
    }

    const dataToUpdate = {};
    const incomingTitle = typeof newTitle !== "undefined" ? newTitle : title;
    if (typeof incomingTitle !== "undefined") {
      const t = String(incomingTitle).trim();
      if (!t) return res.status(400).json({ error: "title cannot be empty" });
      if (t !== chat.title) dataToUpdate.title = t;
    }

    // аватар (опционально)
    const hasAvatarUrl = Object.prototype.hasOwnProperty.call(
      req.body,
      "avatarUrl"
    );
    const hasAvatarPid = Object.prototype.hasOwnProperty.call(
      req.body,
      "avatarPublicId"
    );

    if (hasAvatarUrl || hasAvatarPid) {
      // если поменялся publicId — можно удалить старый
      if (
        chat.avatarPublicId &&
        avatarPublicId &&
        chat.avatarPublicId !== avatarPublicId
      ) {
        try {
          await cloudinary.uploader.destroy(chat.avatarPublicId);
        } catch {}
      }
      dataToUpdate.avatarUrl =
        typeof avatarUrl === "undefined" ? undefined : avatarUrl || null;
      dataToUpdate.avatarPublicId =
        typeof avatarPublicId === "undefined"
          ? undefined
          : avatarPublicId || null;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: "nothing to update" });
    }

    const updated = await prisma.chat.update({
      where: { id: chatId },
      data: dataToUpdate,
      select: {
        id: true,
        type: true,
        title: true,
        avatarUrl: true,
        avatarPublicId: true,
      },
    });

    return res.json({ chat: updated });
  } catch (err) {
    console.error("updateChat failed:", err);
    return res.status(500).json({ error: "failed to update chat" });
  }
};

const deleteChat = async (req, res) => {
  const userId = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  try {
    await ensureMember(chatId, userId);
    await prisma.chat.delete({ where: { id: chatId } });
    res.json({ ok: true });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || "failed" });
  }
};

// group chat: add/remove participant
const addParticipant = async (req, res) => {
  const me = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  const targetId = Number(req.body.userId);
  try {
    await ensureMember(chatId, me);
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { type: true },
    });
    if (!chat) return res.status(404).json({ message: "chat not found" });
    if (chat.type !== "GROUP")
      return res.status(400).json({ message: "not group chat" });

    await prisma.chatParticipant.upsert({
      where: { chatId_userId: { chatId, userId: targetId } },
      create: { chatId, userId: targetId },
      update: {},
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message || "failed to add participant" });
  }
};

const removeParticipant = async (req, res) => {
  const me = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  const targetId = Number(req.params.userId);
  try {
    await ensureMember(chatId, me);
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { type: true },
    });
    if (!chat) return res.status(404).json({ message: "chat not found" });
    if (chat.type !== "GROUP")
      return res.status(400).json({ message: "not group chat" });

    await prisma.chatParticipant.delete({
      where: { chatId_userId: { chatId, userId: targetId } },
    });
    res.json({ ok: true });
  } catch (e) {
    res
      .status(500)
      .json({ message: e.message || "failed to remove participant" });
  }
};

const addChatAvatar = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const chatId = Number(req.params.chatId);
    const { imageUrl, imagePublicId } = req.body || {};

    await ensureMember(chatId, userId);

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) return res.status(404).json({ error: "chat not found" });
    if ((chat.type || "").toUpperCase() !== "GROUP") {
      return res
        .status(400)
        .json({ error: "avatar allowed only for GROUP chats" });
    }

    if (chat.avatarPublicId && chat.avatarPublicId !== imagePublicId) {
      try {
        await cloudinary.uploader.destroy(chat.avatarPublicId);
      } catch {}
    }

    const updated = await prisma.chat.update({
      where: { id: chatId },
      data: {
        avatarUrl: imageUrl || null,
        avatarPublicId: imagePublicId || null,
      },
      select: {
        id: true,
        type: true,
        title: true,
        avatarUrl: true,
        avatarPublicId: true,
        updatedAt: true,
      },
    });

    return res.json({ chat: updated });
  } catch (err) {
    console.error("addChatAvatar failed:", err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "failed" });
  }
};

const deleteChatAvatar = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const chatId = Number(req.params.chatId);

    await ensureMember(chatId, userId);

    const chat = await prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) return res.status(404).json({ error: "chat not found" });
    if ((chat.type || "").toUpperCase() !== "GROUP") {
      return res
        .status(400)
        .json({ error: "avatar allowed only for GROUP chats" });
    }

    if (chat.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(chat.avatarPublicId);
      } catch {}
    }

    const updated = await prisma.chat.update({
      where: { id: chatId },
      data: { avatarUrl: null, avatarPublicId: null },
      select: {
        id: true,
        type: true,
        title: true,
        avatarUrl: true,
        avatarPublicId: true,
        updatedAt: true,
      },
    });

    return res.json({ chat: updated });
  } catch (err) {
    console.error("deleteChatAvatar failed:", err);
    return res
      .status(err.status || 500)
      .json({ error: err.message || "failed" });
  }
};

module.exports = {
  getAllChats,
  getChat,
  createChat,
  updateChat,
  deleteChat,
  addParticipant,
  removeParticipant,
  addChatAvatar,
  deleteChatAvatar,
};
