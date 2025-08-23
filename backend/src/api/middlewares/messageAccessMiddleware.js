const prisma = require("../../utils/prisma");

async function ensureOwnMessage(req, res, next) {
  try {
    const userId = Number(req.user.userId);
    const messageId = Number(req.params.messageId);
    if (!messageId) return res.status(400).json({ error: "invalid messageId" });

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, fromId: true },
    });
    if (!message) return res.status(404).json({ error: "message not found" });

    if (message.fromId !== userId) {
      return res.status(403).json({ error: "not your message" });
    }

    req.message = message; // положим для контроллера, если пригодится
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { ensureOwnMessage };
