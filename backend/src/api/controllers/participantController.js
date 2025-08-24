const prisma = require("../../utils/prisma");
const { createSystemMessage } = require("../../utils/systemMessage");
const { emitToChat } = require("../../socket/hub");
const { SOCKET_EVENTS } = require("../../socket/socketEvents");

const addParticipant = async (req, res) => {
  const userId = Number(req.userId);
  const userName = req.userName;
  const chatId = Number(req.chatId);
  const targetId = Number(req.targetId);
  const targetName = req.targetName;

  try {
    const systemMessage = await prisma.$transaction(async (tx) => {
      await tx.chatParticipant.upsert({
        where: { chatId_userId: { chatId, userId: targetId } },
        create: { chatId, userId: targetId, role: "MEMBER" },
        update: {},
      });
      const systemMessage = await createSystemMessage(tx, {
        chatId,
        action: "member_added",
        userId,
        targetId,
        extra: {
          userName: userName,
          targetName: targetName,
        },
      });
      return systemMessage;
    });

    emitToChat(chatId, SOCKET_EVENTS.RECEIVE_MESSAGE, systemMessage);
    res.json({ ok: true });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "failed to add participant" });
  }
};

const removeParticipant = async (req, res) => {
  const userId = Number(req.userId);
  const userName = req.userName;
  const chatId = Number(req.chatId);
  const targetId = Number(req.targetId);
  const targetName = req.targetName;

  try {
    const systemMessage = await prisma.$transaction(async (tx) => {
      await tx.chatParticipant.delete({
        where: { chatId_userId: { chatId, userId: targetId } },
      });
      const systemMessage = await createSystemMessage(tx, {
        chatId,
        action: "member_removed",
        userId,
        targetId,
        extra: {
          userName: userName,
          targetName: targetName,
        },
      });
      return systemMessage;
    });

    emitToChat(chatId, SOCKET_EVENTS.RECEIVE_MESSAGE, systemMessage);
    res.json({ ok: true });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "failed to remove participant" });
  }
};

const promoteToAdmin = async (req, res) => {
  const userId = Number(req.userId);
  const userName = req.userName;
  const chatId = Number(req.chatId);
  const targetId = Number(req.targetId);
  const targetName = req.targetName;

  try {
    const systemMessage = await prisma.$transaction(async (tx) => {
      await tx.chatParticipant.update({
        where: { chatId_userId: { chatId, userId: targetId } },
        data: { role: "ADMIN" },
      });
      const systemMessage = await createSystemMessage(tx, {
        chatId,
        action: "promoted_to_admin",
        userId,
        targetId,
        extra: {
          userName: userName,
          targetName: targetName,
        },
      });
      return systemMessage;
    });

    emitToChat(chatId, SOCKET_EVENTS.RECEIVE_MESSAGE, systemMessage);
    res.json({ ok: true });
  } catch (err) {
    console.error("promoteToAdmin failed:", err);
    res.status(500).json({ error: "failed" });
  }
};

const demoteFromAdmin = async (req, res) => {
  const userId = Number(req.userId);
  const userName = req.userName;
  const chatId = Number(req.chatId);
  const targetId = Number(req.targetId);
  const targetName = req.targetName;

  try {
    const systemMessage = await prisma.$transaction(async (tx) => {
      await tx.chatParticipant.update({
        where: { chatId_userId: { chatId, userId: targetId } },
        data: { role: "MEMBER" },
      });
      const systemMessage = await createSystemMessage(tx, {
        chatId,
        action: "demoted_from_admin",
        userId,
        targetId,
        extra: {
          userName: userName,
          targetName: targetName,
        },
      });
      return systemMessage;
    });

    emitToChat(chatId, SOCKET_EVENTS.RECEIVE_MESSAGE, systemMessage);
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
