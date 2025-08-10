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

const getUserMessages = async (req, res) => {
  const userId = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const cursor = req.query.cursor ? Number(req.query.cursor) : null;

  try {
    await ensureMember(chatId, userId);

    const messages = await prisma.message.findMany({
      where: { chatId },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        chatId: true,
        fromId: true,
        text: true,
        imageUrl: true,
        imagePublicId: true,
        read: true,
        edited: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ messages, nextCursor: messages.at(-1)?.id ?? null });
  } catch (e) {
    console.error("listMessages failed:", e);
    res.status(e.status || 500).json({ message: e.message || "failed" });
  }
};

const createMessage = async (req, res) => {
  const userId = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  const { text, imageUrl, imagePublicId } = req.body || {};
  try {
    await ensureMember(chatId, userId);
    if ((!text || !text.trim()) && !imageUrl) {
      return res
        .status(400)
        .json({ message: "message must have text or image" });
    }

    const msg = await prisma.message.create({
      data: {
        chatId,
        fromId: userId,
        text: text?.trim() || "",
        imageUrl: imageUrl || null,
        imagePublicId: imagePublicId || null,
        read: false,
      },
      select: {
        id: true,
        chatId: true,
        fromId: true,
        text: true,
        imageUrl: true,
        imagePublicId: true,
        read: true,
        edited: true,
        createdAt: true,
      },
    });

    // touch chat updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(msg);
  } catch (e) {
    console.error("createMessage failed:", e);
    res.status(e.status || 500).json({ message: e.message || "failed" });
  }
};

const updateMessage = async (req, res) => {
  const userId = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  const messageId = Number(req.params.messageId);
  const { text, imageUrl, imagePublicId } = req.body || {};

  try {
    await ensureMember(chatId, userId);

    const existing = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!existing || existing.chatId !== chatId || existing.fromId !== userId) {
      return res.status(403).json({ message: "cannot edit this message" });
    }

    if (
      typeof text === "string" &&
      !text.trim() &&
      typeof imageUrl === "undefined"
    ) {
      return res
        .status(400)
        .json({ message: "text empty and no image change" });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        text: typeof text === "string" ? text.trim() : existing.text,
        imageUrl:
          typeof imageUrl !== "undefined" ? imageUrl : existing.imageUrl,
        imagePublicId:
          typeof imagePublicId !== "undefined"
            ? imagePublicId
            : existing.imagePublicId,
        edited: true,
      },
      select: {
        id: true,
        chatId: true,
        fromId: true,
        text: true,
        imageUrl: true,
        imagePublicId: true,
        read: true,
        edited: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updated);
  } catch (e) {
    console.error("updateMessage failed:", e);
    res.status(e.status || 500).json({ message: e.message || "failed" });
  }
};

const deleteMessage = async (req, res) => {
  const userId = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  const messageId = Number(req.params.messageId);

  try {
    await ensureMember(chatId, userId);

    const existing = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!existing || existing.chatId !== chatId || existing.fromId !== userId) {
      return res.status(403).json({ message: "cannot delete this message" });
    }

    await prisma.message.delete({ where: { id: messageId } });

    // найти новый last для клиента (удобно)
    const nextLast = await prisma.message.findFirst({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      select: { id: true, text: true, imageUrl: true, createdAt: true },
    });

    res.json({
      id: messageId,
      chatId,
      nextLast: nextLast
        ? {
            id: nextLast.id,
            text: nextLast.text ?? "",
            imageUrl: nextLast.imageUrl ?? null,
            createdAt: nextLast.createdAt,
          }
        : null,
    });
  } catch (e) {
    console.error("deleteMessage failed:", e);
    res.status(e.status || 500).json({ message: e.message || "failed" });
  }
};

module.exports = {
  getUserMessages,
  createMessage,
  updateMessage,
  deleteMessage,
};
