const prisma = require("../../utils/prisma");

async function ensureOwnMessage(req, res, next) {
  try {
    const userId = Number(req.userId);
    const chatId = Number(req.chatId);
    const messageId = Number(req.params.messageId);
    if (!messageId) return res.status(400).json({ error: "invalid messageId" });

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, chatId: true, fromId: true },
    });
    if (!message || message.chatId !== chatId)
      return res.status(404).json({ error: "message not found" });

    if (message.fromId !== userId) {
      return res.status(403).json({ error: "not your message" });
    }

    req.message = message;
    req.messageId = message.id;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { ensureOwnMessage };
