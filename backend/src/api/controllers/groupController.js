const prisma = require("../../utils/prisma");
const cloudinary = require("../../../cloudinary");
const { createSystemMessage } = require("../../utils/systemMessage");
const { emitToChatAndUsers } = require("../../socket/hub");
const { SOCKET_EVENTS } = require("../../socket/socketEvents");

const deleteGroup = async (req, res) => {
  const chatId = Number(req.chatId);
  try {
    emitToChatAndUsers(chatId, SOCKET_EVENTS.CHAT_DELETED, { chatId });
    await prisma.chat.delete({ where: { id: chatId } });
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "failed" });
  }
};

const editGroup = async (req, res) => {
  try {
    const userId = Number(req.userId);
    const chatId = Number(req.chatId);
    const userName = req.userName;
    const { newTitle, avatarUrl, avatarPublicId } = req.body || {};

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, title: true, avatarPublicId: true },
    });
    if (!chat) return res.status(404).json({ error: "chat not found" });

    const dataToUpdate = {};
    if (typeof newTitle !== "undefined") {
      const title = String(newTitle).trim();
      if (!title)
        return res.status(400).json({ error: "title cannot be empty" });
      if (title !== chat.title) dataToUpdate.title = title;
    }
    const hasAvatarUrl = Object.prototype.hasOwnProperty.call(
      req.body,
      "avatarUrl"
    );
    const hasAvatarPid = Object.prototype.hasOwnProperty.call(
      req.body,
      "avatarPublicId"
    );

    if (hasAvatarUrl || hasAvatarPid) {
      if (
        chat.avatarPublicId &&
        avatarPublicId &&
        chat.avatarPublicId !== avatarPublicId
      ) {
        try {
          await cloudinary.uploader.destroy(chat.avatarPublicId);
        } catch {}
      }
      dataToUpdate.avatarUrl =
        typeof avatarUrl === "undefined" ? undefined : avatarUrl || null;
      dataToUpdate.avatarPublicId =
        typeof avatarPublicId === "undefined"
          ? undefined
          : avatarPublicId || null;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: "nothing to update" });
    }

    const { updated, systemMessages } = await prisma.$transaction(
      async (tx) => {
        const updated = await tx.chat.update({
          where: { id: chatId },
          data: dataToUpdate,
          select: {
            id: true,
            type: true,
            title: true,
            avatarUrl: true,
            avatarPublicId: true,
          },
        });

        const systemMessages = [];

        if (
          typeof dataToUpdate.title !== "undefined" &&
          dataToUpdate.title !== chat.title
        ) {
          const systemMessage = await createSystemMessage(tx, {
            chatId,
            action: "title_changed",
            userId,
            extra: { userName: userName, title: dataToUpdate.title },
          });
          systemMessages.push(systemMessage);
        }

        const avatarTouched =
          Object.prototype.hasOwnProperty.call(dataToUpdate, "avatarUrl") ||
          Object.prototype.hasOwnProperty.call(dataToUpdate, "avatarPublicId");

        if (avatarTouched) {
          const systemMessage = await createSystemMessage(tx, {
            chatId,
            action: "avatar_changed",
            userId,
            extra: { userName: userName, to: updated.avatarUrl || null },
          });
          systemMessages.push(systemMessage);
        }

        return { updated, systemMessages };
      }
    );

    for (const m of systemMessages) {
      emitToChatAndUsers(chatId, userId, SOCKET_EVENTS.RECEIVE_MESSAGE, m);
    }
    return res.json({ chat: updated });
  } catch (err) {
    console.error("updateChat failed:", err);
    return res.status(500).json({ error: "failed to update chat" });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const userId = Number(req.userId);
    const userName = req.userName;
    const chatId = Number(req.chatId);

    const systemMessage = await prisma.$transaction(async (tx) => {
      await tx.chatParticipant.delete({
        where: { chatId_userId: { chatId, userId } },
      });
      const systemMessage = await createSystemMessage(tx, {
        chatId,
        action: "member_left",
        userId,
        extra: { userName: userName },
      });
      return systemMessage;
    });

    emitToChatAndUsers(chatId, SOCKET_EVENTS.RECEIVE_MESSAGE, systemMessage);
    return res.json({ ok: true });
  } catch (err) {
    console.error("leaveChat failed:", err);
    return res.status(500).json({ error: "failed to leave chat" });
  }
};

module.exports = {
  editGroup,
  deleteGroup,
  leaveGroup,
};
