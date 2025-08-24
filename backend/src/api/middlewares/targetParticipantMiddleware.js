const prisma = require("../../utils/prisma");

function parseTargetId(req, res, next) {
  const fromParams = req.params.userId;
  const fromBody = req.body?.userId;
  const raw = typeof fromParams !== "undefined" ? fromParams : fromBody;

  const targetId = Number(raw);
  if (!targetId || Number.isNaN(targetId)) {
    return res.status(400).json({ error: "invalid or missing target userId" });
  }

  req.targetId = targetId;
  next();
}

async function ensureTargetUserExists(req, res, next) {
  const targetId = Number(req.targetId);
  const targetUser = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, username: true },
  });

  req.targetName = targetUser.username;
  next();
}

async function ensureTargetMember(req, res, next) {
  const chatId = Number(req.chatId);
  const targetId = Number(req.targetId);
  const targetUser = await prisma.chatParticipant.findUnique({
    where: { chatId_userId: { chatId, userId: targetId } },
    select: { userId: true, role: true },
  });
  if (!targetUser) {
    return res.status(404).json({ error: "target user is not in this chat" });
  }

  req.targetRole = targetUser.role;
  next();
}

function ensureTargetNotOwner(req, res, next) {
  const role = req.targetRole;
  if (role === "OWNER") {
    return res.status(400).json({ error: "cannot operate on chat owner" });
  }
  next();
}

module.exports = {
  parseTargetId,
  ensureTargetUserExists,
  ensureTargetMember,
  ensureTargetNotOwner,
};
