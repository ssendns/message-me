const prisma = require("../../utils/prisma");
const {
  ensureMember,
  getRole,
  isAdminOrOwner,
} = require("../../utils/chatUtils");
const { createSystemMessage } = require("../../utils/systemMessage");
const { emitToChat } = require("../../socket/hub");

const addParticipant = async (req, res) => {
  const userId = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
  const targetId = Number(req.body.userId);
  try {
    await ensureMember(chatId, userId);
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { type: true },
    });
    if (!chat) return res.status(404).json({ message: "chat not found" });
    if (chat.type !== "GROUP")
      return res.status(400).json({ message: "not group chat" });

    const user = await getRole(chatId, userId);
    if (!user || !isAdminOrOwner(user.role)) {
      return res.status(403).json({ error: "insufficient permissions" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.chatParticipant.upsert({
        where: { chatId_userId: { chatId, userId: targetId } },
        create: { chatId, userId: targetId, role: "MEMBER" },
        update: {},
      });
      const systemMessage = await createSystemMessage(prisma, {
        chatId,
        action: "member_added",
        userId,
        targetId,
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
    await ensureMember(chatId, userId);
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { type: true },
    });
    if (!chat) return res.status(404).json({ message: "chat not found" });
    if (chat.type !== "GROUP")
      return res.status(400).json({ message: "not group chat" });

    const user = await getRole(chatId, userId);
    if (!user || !isAdminOrOwner(user.role)) {
      return res.status(403).json({ error: "insufficient permissions" });
    }

    const target = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: targetId } },
      select: { role: true },
    });
    if (!target) return res.json({ ok: true });

    if (target.role === "OWNER") {
      return res.status(400).json({ message: "cannot remove owner" });
    }
    if (user.role === "ADMIN" && target.role === "ADMIN") {
      return res
        .status(403)
        .json({ message: "admin cannot remove another admin" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.chatParticipant.delete({
        where: { chatId_userId: { chatId, userId: targetId } },
      });
      const systemMessage = await createSystemMessage(prisma, {
        chatId,
        action: "member_removed",
        userId,
        targetId,
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
  try {
    const userId = Number(req.user.userId);
    const chatId = Number(req.params.chatId);
    const targetId = Number(req.body.userId);

    await ensureMember(chatId, userId);
    const user = await getRole(chatId, userId);
    if (!user || user.role !== "OWNER")
      return res.status(403).json({ error: "only owner can promote" });

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
      const systemMessage = await createSystemMessage(prisma, {
        chatId,
        action: "promoted_to_admin",
        userId,
        targetId,
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
  try {
    const userId = Number(req.user.userId);
    const chatId = Number(req.params.chatId);
    const targetId = Number(req.params.userId);

    await ensureMember(chatId, userId);
    const user = await getRole(chatId, userId);
    if (!user || user.role !== "OWNER")
      return res.status(403).json({ error: "only owner can demote" });

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
      const systemMessage = await createSystemMessage(prisma, {
        chatId,
        action: "demoted_from_admin",
        userId,
        targetId,
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
