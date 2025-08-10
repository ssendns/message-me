const prisma = require("../utils/db");

async function getOrCreateChat(user1, user2) {
  const [u1, u2] = [Math.min(user1, user2), Math.max(user1, user2)];
  let chat = await prisma.chat.findFirst({
    where: {
      participants: { some: { userId: u1 } },
      AND: { participants: { some: { userId: u2 } } },
    },
    select: { id: true },
  });
  if (!chat) {
    chat = await prisma.chat.create({
      data: {
        participants: { create: [{ userId: u1 }, { userId: u2 }] },
      },
      select: { id: true },
    });
  }
  return chat.id;
}

async function getOtherUserIds(chatId, userId) {
  const participants = await prisma.chatParticipant.findMany({
    where: { chatId },
    select: { userId: true },
  });
  return participants.map((p) => p.userId).filter((uid) => uid !== userId);
}

async function getChatMessages(req, res) {
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

module.exports = {
  getOrCreateChat,
  getChatMessages,
  getOtherUserIds,
  getAllChats,
};
