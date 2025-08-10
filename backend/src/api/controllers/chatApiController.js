const prisma = require("../../utils/db");

async function ensureMember(chatId, userId) {
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, participants: { some: { userId } } },
    select: { id: true },
  });
  if (!chat) {
    const err = new Error("forbidden");
    err.status = 403;
    throw err;
  }
}

const getAllChats = async (req, res) => {
  const userId = req.user.userId;
  try {
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true },
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

    const result = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = chat.messages[0] || null;

        const unreadCount = await prisma.message.count({
          where: {
            chatId: chat.id,
            read: false,
            fromId: { not: userId },
          },
        });

        return {
          id: chat.id,
          type: chat.type,
          title: chat.title,
          participants: chat.participants.map((p) => ({
            id: p.user.id,
            username: p.user.username,
          })),
          lastMessage,
          unreadCount,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("getAllChats failed:", err);
    res.status(500).json({ message: "failed to load chats" });
  }
};

const getChatMessages = async (req, res) => {
  try {
    const chatId = Number(req.params.chatId);
    if (!chatId) {
      return res.status(400).json({ error: "invalid chatId" });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    });

    return res.json({ messages });
  } catch (err) {
    console.error("getChatMessages failed:", err);
    return res.status(500).json({ error: "failed to fetch messages" });
  }
};

// body: { type: 'DIRECT'|'GROUP', peerId? (for direct), title? (for group), participantIds? (for group) }
const createChat = async (req, res) => {
  const userId = Number(req.user.userId);
  const { type, peerId, title, participantIds } = req.body;

  try {
    if (type === "DIRECT") {
      const u1 = Math.min(userId, Number(peerId));
      const u2 = Math.max(userId, Number(peerId));
      if (!u2) return res.status(400).json({ message: "peerId required" });

      let chat = await prisma.chat.findFirst({
        where: {
          type: "DIRECT",
          participants: { some: { userId: u1 } },
          AND: { participants: { some: { userId: u2 } } },
        },
        select: { id: true },
      });
      if (!chat) {
        chat = await prisma.chat.create({
          data: {
            type: "DIRECT",
            participants: { create: [{ userId: u1 }, { userId: u2 }] },
          },
          select: { id: true },
        });
      }
      return res.json({ id: chat.id });
    }

    if (type === "GROUP") {
      const ids = Array.from(new Set([userId, ...(participantIds || [])])).map(
        Number
      );
      if (!title) return res.status(400).json({ message: "title required" });
      const chat = await prisma.chat.create({
        data: {
          type: "GROUP",
          title,
          participants: { create: ids.map((id) => ({ userId: id })) },
        },
        select: { id: true },
      });
      return res.status(201).json({ id: chat.id });
    }

    return res.status(400).json({ message: "invalid chat type" });
  } catch (e) {
    console.error("createChat failed:", e);
    res.status(e.status || 500).json({ message: e.message || "failed" });
  }
};

const updateChat = async (req, res) => {
  const userId = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  const { title } = req.body;
  try {
    await ensureMember(chatId, userId);
    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: { title: title ?? undefined },
      select: { id: true, title: true },
    });
    res.json(chat);
  } catch (e) {
    console.error("updateChat failed:", e);
    res.status(e.status || 500).json({ message: e.message || "failed" });
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
    console.error("deleteChat failed:", e);
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
    if (chat.type !== "PUBLIC")
      return res.status(400).json({ message: "not public chat" });

    await prisma.chatParticipant.upsert({
      where: { chatId_userId: { chatId, userId: targetId } },
      create: { chatId, userId: targetId },
      update: {},
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("addParticipant failed:", e);
    res.status(e.status || 500).json({ message: e.message || "failed" });
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
    if (chat.type !== "PUBLIC")
      return res.status(400).json({ message: "not public chat" });

    await prisma.chatParticipant.delete({
      where: { chatId_userId: { chatId, userId: targetId } },
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("removeParticipant failed:", e);
    res.status(e.status || 500).json({ message: e.message || "failed" });
  }
};

module.exports = {
  getAllChats,
  getChatMessages,
  createChat,
  updateChat,
  deleteChat,
  addParticipant,
  removeParticipant,
};
