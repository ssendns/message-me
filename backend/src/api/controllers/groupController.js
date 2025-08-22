const prisma = require("../../utils/prisma");
const cloudinary = require("../../../cloudinary");
const {
  ensureMember,
  getRole,
  isAdminOrOwner,
} = require("../../utils/chatUtils");
const { createSystemMessage } = require("../../utils/systemMessage");

const deleteGroup = async (req, res) => {
  const userId = Number(req.user.userId);
  const chatId = Number(req.params.chatId);
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
    if (!user || user.role !== "OWNER") {
      return res
        .status(403)
        .json({ message: "only owner can delete the group" });
    }

    await prisma.chat.delete({ where: { id: chatId } });
    res.json({ ok: true });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message || "failed" });
  }
};

const editGroup = async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const chatId = Number(req.params.chatId);
    const { newTitle, avatarUrl, avatarPublicId } = req.body || {};

    await ensureMember(chatId, userId);

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, type: true, title: true, avatarPublicId: true },
    });
    if (!chat) return res.status(404).json({ error: "chat not found" });
    if (String(chat.type).toUpperCase() !== "GROUP") {
      return res.status(400).json({ error: "cannot edit DIRECT chat" });
    }

    const user = await getRole(chatId, userId);
    if (!user || !isAdminOrOwner(user.role)) {
      return res.status(403).json({ error: "insufficient permissions" });
    }

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
        await createSystemMessage(prisma, {
          chatId,
          action: "title_changed",
          actorId: userId,
          extra: { fromTitle: chat.title, toTitle: dataToUpdate.title },
        });
      }

      const avatarTouched =
        Object.prototype.hasOwnProperty.call(dataToUpdate, "avatarUrl") ||
        Object.prototype.hasOwnProperty.call(dataToUpdate, "avatarPublicId");
      if (avatarTouched) {
        await createSystemMessage(prisma, {
          chatId,
          action: "avatar_changed",
          actorId: userId,
          extra: { to: updated.avatarUrl || null },
        });
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

    await ensureMember(chatId, userId);

    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
      select: { role: true, chat: { select: { type: true } } },
    });
    if (!participant) return res.status(404).json({ error: "not in chat" });

    if (participant.chat.type !== "GROUP") {
      return res.status(400).json({ error: "cannot leave a DIRECT chat" });
    }

    if (participant.role === "OWNER") {
      return res
        .status(403)
        .json({ error: "owner cannot leave; delete chat instead" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.chatParticipant.delete({
        where: { chatId_userId: { chatId, userId } },
      });
      await createSystemMessage(tx, {
        chatId,
        action: "member_left",
        userId,
      });
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
