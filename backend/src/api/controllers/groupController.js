const prisma = require("../../utils/prisma");
const cloudinary = require("../../../cloudinary");
const { createSystemMessage } = require("../../utils/systemMessage");
const { emitToChat } = require("../../socket/hub");

const deleteGroup = async (req, res) => {
  const chatId = Number(req.params.chatId);
  try {
    await prisma.chat.delete({ where: { id: chatId } });
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "failed" });
  }
};

const editGroup = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const chatId = Number(req.params.chatId);
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

    const updated = await prisma.chat.update({
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

    try {
      if (
        typeof dataToUpdate.title !== "undefined" &&
        dataToUpdate.title !== chat.title
      ) {
        const systemMessage = await createSystemMessage(prisma, {
          chatId,
          action: "title_changed",
          userId,
          extra: { title: dataToUpdate.title },
        });
        emitToChat(chatId, "receive_message", systemMessage);
      }

      const avatarTouched =
        Object.prototype.hasOwnProperty.call(dataToUpdate, "avatarUrl") ||
        Object.prototype.hasOwnProperty.call(dataToUpdate, "avatarPublicId");
      if (avatarTouched) {
        const systemMessage = await createSystemMessage(prisma, {
          chatId,
          action: "avatar_changed",
          userId,
          extra: { to: updated.avatarUrl || null },
        });
        emitToChat(chatId, "receive_message", systemMessage);
      }
    } catch (err) {
      console.error("system message (editGroup) failed:", err);
    }

    return res.json({ chat: updated });
  } catch (err) {
    console.error("updateChat failed:", err);
    return res.status(500).json({ error: "failed to update chat" });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const chatId = Number(req.params.chatId);

    await prisma.$transaction(async (tx) => {
      await tx.chatParticipant.delete({
        where: { chatId_userId: { chatId, userId } },
      });
      const systemMessage = await createSystemMessage(tx, {
        chatId,
        action: "member_left",
        userId,
      });
      emitToChat(chatId, "receive_message", systemMessage);
    });

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
