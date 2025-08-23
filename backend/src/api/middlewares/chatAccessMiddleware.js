const prisma = require("../../utils/prisma");

const isOwner = (role) => role === "OWNER";
const isAdminOrOwner = (role) => role === "ADMIN" || role === "OWNER";

async function ensureMember(req, res, next) {
  try {
    const userId = Number(req.user.userId);
    const chatId = Number(req.params.chatId);
    if (!chatId) return res.status(400).json({ error: "invalid chatId" });

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, type: true, title: true, avatarUrl: true },
    });
    if (!chat) return res.status(404).json({ error: "chat not found" });

    const membership = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
      select: { userId: true, role: true },
    });
    if (!membership) return res.status(403).json({ error: "forbidden" });

    req.chat = chat;
    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
}

function requireGroup(req, res, next) {
  if ((req.chat?.type || "").toUpperCase() !== "GROUP") {
    return res.status(400).json({ error: "not a group chat" });
  }
  next();
}

function requireAdminOrOwner(req, res, next) {
  if (!req.membership?.role || !isAdminOrOwner(req.membership.role)) {
    return res.status(403).json({ error: "insufficient permissions" });
  }
  next();
}

function requireOwner(req, res, next) {
  if (!req.membership?.role || !isOwner(req.membership.role)) {
    return res.status(403).json({ error: "owner only" });
  }
  next();
}

module.exports = {
  ensureMember,
  requireGroup,
  requireAdminOrOwner,
  requireOwner,
};
