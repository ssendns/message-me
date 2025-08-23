const prisma = require("../../utils/prisma");
const { ensureMember, privateKey } = require("../../utils/chatUtils");
const { createSystemMessage } = require("../../utils/systemMessage");
const { emitToChat } = require("../../socket/hub");

const getAllChats = async (req, res) => {
  const userId = Number(req.user.userId);

  try {
    const chats = await prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          select: {
            role: true,
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
            type: true,
            meta: true,
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
          role: p.role,
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

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          select: {
            role: true,
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
            type: true,
            meta: true,
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
        role: p.role,
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

// body: { type: 'DIRECT'|'GROUP', peerId? (for direct), title? (for group), participantIds? (for group), avatarUrl?, avatarPublicId? (for group)}
const createChat = async (req, res) => {
  const userId = Number(req.user.userId);
  const { type, peerId, title, participantIds, avatarUrl, avatarPublicId } =
    req.body || {};

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

      const participantsCreate = ids.map((id) => ({
        userId: id,
        role: id === userId ? "OWNER" : "MEMBER",
      }));

      const chat = await prisma.$transaction(async (tx) => {
        const created = await tx.chat.create({
          data: {
            type: "GROUP",
            title: title.trim(),
            avatarUrl:
              typeof avatarUrl === "undefined" ? null : avatarUrl || null,
            avatarPublicId:
              typeof avatarPublicId === "undefined"
                ? null
                : avatarPublicId || null,
            participants: { create: participantsCreate },
          },
          select: { id: true, title: true },
        });

        const owner = await tx.user.findUnique({
          where: { id: userId },
          select: { username: true },
        });

        const systemMessage = await createSystemMessage(tx, {
          chatId: created.id,
          action: "group_created",
          userId,
          extra: { userName: owner?.username, title: title.trim() },
        });

        emitToChat(created.id, "receive_message", systemMessage);

        return created;
      });

      return res.status(201).json({ id: chat.id });
    }

    return res.status(400).json({ message: "invalid chat type" });
  } catch (err) {
    res.status(500).json({ message: err.message || "failed to create chat" });
  }
};

module.exports = {
  getAllChats,
  getChat,
  createChat,
};
