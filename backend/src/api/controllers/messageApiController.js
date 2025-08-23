const prisma = require("../../utils/prisma");

const MESSAGE_SELECT = {
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
  type: true,
  meta: true,
};

const getChatMessages = async (req, res) => {
  const chatId = Number(req.params.chatId);
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const cursor = req.query.cursor ? Number(req.query.cursor) : null;
  const direction = (req.query.direction || "older").toLowerCase();

  try {
    if (direction === "newer") {
      const items = await prisma.message.findMany({
        where: { chatId },
        orderBy: { id: "asc" },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: limit,
        select: MESSAGE_SELECT,
      });
      return res.json({
        messages: items,
        nextCursor: items.at(-1)?.id ?? null,
      });
    }

    const olderBatch = await prisma.message.findMany({
      where: { chatId },
      orderBy: { id: "desc" },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: limit,
      select: MESSAGE_SELECT,
    });

    const messages = olderBatch.slice().reverse();
    const nextCursor = messages[0]?.id ?? null;
    return res.json({ messages, nextCursor });
  } catch (err) {
    console.error("listMessages failed:", err);
    res.status(err.status || 500).json({ message: err.message || "failed" });
  }
};

const createMessage = async (req, res) => {
  const userId = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  const { text, imageUrl, imagePublicId } = req.body || {};

  try {
    const hasText = typeof text === "string" && text.trim().length > 0;
    if (!hasText && !imageUrl) {
      return res
        .status(400)
        .json({ message: "message must have text or image" });
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        fromId: userId,
        text: hasText ? text.trim() : "",
        imageUrl: imageUrl || null,
        imagePublicId: imagePublicId || null,
        read: false,
        type: "TEXT",
      },
      select: MESSAGE_SELECT,
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(message);
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "failed to create message" });
  }
};

const updateMessage = async (req, res) => {
  const messageId = Number(req.params.messageId);
  const { text, imageUrl, imagePublicId } = req.body || {};

  try {
    const existing = await prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!existing)
      return res.status(404).json({ message: "message not found" });

    const nextText = typeof text === "string" ? text.trim() : existing.text;
    const nextImageUrl =
      typeof imageUrl !== "undefined" ? imageUrl : existing.imageUrl;
    const nextImagePublicId =
      typeof imagePublicId !== "undefined"
        ? imagePublicId
        : existing.imagePublicId;

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        text: nextText,
        imageUrl: nextImageUrl,
        imagePublicId: nextImagePublicId,
        edited: true,
      },
      select: MESSAGE_SELECT,
    });

    res.status(200).json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "failed to update message" });
  }
};

const deleteMessage = async (req, res) => {
  const chatId = Number(req.params.chatId);
  const messageId = Number(req.params.messageId);

  try {
    await prisma.message.delete({ where: { id: messageId } });

    const nextLast = await prisma.message.findFirst({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        text: true,
        imageUrl: true,
        createdAt: true,
        type: true,
        meta: true,
      },
    });

    res.status(200).json({
      id: messageId,
      chatId,
      nextLast: nextLast
        ? {
            id: nextLast.id,
            text: nextLast.text ?? "",
            imageUrl: nextLast.imageUrl ?? null,
            createdAt: nextLast.createdAt,
            type: nextLast.type,
            meta: nextLast.meta,
          }
        : null,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "failed to delete message" });
  }
};

module.exports = {
  getChatMessages,
  createMessage,
  updateMessage,
  deleteMessage,
};
