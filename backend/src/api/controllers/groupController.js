const prisma = require("../../utils/prisma");
const cloudinary = require("../../../cloudinary");
const {
  ensureMember,
  getRole,
  isAdminOrOwner,
} = require("../../utils/chatUtils");

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

    return res.json({ chat: updated });
  } catch (err) {
    console.error("updateChat failed:", err);
    return res.status(500).json({ error: "failed to update chat" });
  }
};

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

    await prisma.chatParticipant.upsert({
      where: { chatId_userId: { chatId, userId: targetId } },
      create: { chatId, userId: targetId, role: "MEMBER" },
      update: {},
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

    await prisma.chatParticipant.delete({
      where: { chatId_userId: { chatId, userId: targetId } },
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

    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId: targetId } },
      data: { role: "ADMIN" },
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

    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId: targetId } },
      data: { role: "MEMBER" },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("demoteFromAdmin failed:", err);
    res.status(500).json({ error: "failed" });
  }
};

module.exports = {
  editGroup,
  addParticipant,
  removeParticipant,
  promoteToAdmin,
  demoteFromAdmin,
  deleteGroup,
};
