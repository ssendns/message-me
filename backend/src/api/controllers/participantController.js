const prisma = require("../../utils/prisma");
const { createSystemMessage } = require("../../utils/systemMessage");
const { emitToChat } = require("../../socket/hub");

const addParticipant = async (req, res) => {
  const userId = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  const targetId = Number(req.body.userId);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.chatParticipant.upsert({
        where: { chatId_userId: { chatId, userId: targetId } },
        create: { chatId, userId: targetId, role: "MEMBER" },
        update: {},
      });
      const [user, target] = await Promise.all([
        tx.user.findUnique({
          where: { id: userId },
          select: { username: true },
        }),
        tx.user.findUnique({
          where: { id: targetId },
          select: { username: true },
        }),
      ]);
      const systemMessage = await createSystemMessage(tx, {
        chatId,
        action: "member_added",
        userId,
        targetId,
        extra: {
          userName: user?.username,
          targetName: target?.username,
        },
      });
      emitToChat(chatId, "receive_message", systemMessage);
    });

    res.json({ ok: true });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "failed to add participant" });
  }
};

const removeParticipant = async (req, res) => {
  const userId = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  const targetId = Number(req.params.userId);
  try {
    const target = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: targetId } },
      select: { role: true },
    });
    if (!target) return res.json({ ok: true });
    if (target.role === "OWNER") {
      return res.status(400).json({ message: "cannot remove owner" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.chatParticipant.delete({
        where: { chatId_userId: { chatId, userId: targetId } },
      });
      const [user, target] = await Promise.all([
        tx.user.findUnique({
          where: { id: userId },
          select: { username: true },
        }),
        tx.user.findUnique({
          where: { id: targetId },
          select: { username: true },
        }),
      ]);
      const systemMessage = await createSystemMessage(tx, {
        chatId,
        action: "member_removed",
        userId,
        targetId,
        extra: {
          userName: user?.username,
          targetName: target?.username,
        },
      });
      emitToChat(chatId, "receive_message", systemMessage);
    });
    res.json({ ok: true });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "failed to remove participant" });
  }
};

const promoteToAdmin = async (req, res) => {
  const userId = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  const targetId = Number(req.body.userId);
  try {
    const target = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: targetId } },
      select: { role: true },
    });
    if (!target) return res.status(404).json({ error: "user not in chat" });
    if (target.role === "OWNER")
      return res.status(400).json({ error: "owner already" });

    await prisma.$transaction(async (tx) => {
      await tx.chatParticipant.update({
        where: { chatId_userId: { chatId, userId: targetId } },
        data: { role: "ADMIN" },
      });
      const [user, target] = await Promise.all([
        tx.user.findUnique({
          where: { id: userId },
          select: { username: true },
        }),
        tx.user.findUnique({
          where: { id: targetId },
          select: { username: true },
        }),
      ]);
      const systemMessage = await createSystemMessage(tx, {
        chatId,
        action: "promoted_to_admin",
        userId,
        targetId,
        extra: {
          userName: user?.username,
          targetName: target?.username,
        },
      });
      emitToChat(chatId, "receive_message", systemMessage);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("promoteToAdmin failed:", err);
    res.status(500).json({ error: "failed" });
  }
};

const demoteFromAdmin = async (req, res) => {
  const userId = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  const targetId = Number(req.params.userId);
  try {
    const target = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: targetId } },
      select: { role: true },
    });
    if (!target) return res.status(404).json({ error: "user not in chat" });
    if (target.role === "OWNER")
      return res.status(400).json({ error: "cannot demote owner" });

    await prisma.$transaction(async (tx) => {
      await tx.chatParticipant.update({
        where: { chatId_userId: { chatId, userId: targetId } },
        data: { role: "MEMBER" },
      });
      const [user, target] = await Promise.all([
        tx.user.findUnique({
          where: { id: userId },
          select: { username: true },
        }),
        tx.user.findUnique({
          where: { id: targetId },
          select: { username: true },
        }),
      ]);
      const systemMessage = await createSystemMessage(tx, {
        chatId,
        action: "demoted_from_admin",
        userId,
        targetId,
        extra: {
          userName: user?.username,
          targetName: target?.username,
        },
      });
      emitToChat(chatId, "receive_message", systemMessage);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("demoteFromAdmin failed:", err);
    res.status(500).json({ error: "failed" });
  }
};

module.exports = {
  addParticipant,
  removeParticipant,
  promoteToAdmin,
  demoteFromAdmin,
};
