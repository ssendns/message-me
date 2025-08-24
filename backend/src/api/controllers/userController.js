const prisma = require("../../utils/prisma");
const bcrypt = require("bcryptjs");
const cloudinary = require("../../../cloudinary");

const getAllUsers = async (req, res) => {
  const userId = req.userId;
  const users = await prisma.user.findMany({
    where: {
      id: { not: userId },
    },
    select: {
      id: true,
      username: true,
    },
  });

  res.json(users);
};

const getCurrentUser = async (req, res) => {
  const userId = req.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
    },
  });
  res.status(200).json({
    user: { id: user.id, username: user.username, avatarUrl: user.avatarUrl },
  });
};

const getUserByUsername = async (req, res) => {
  const { username } = req.params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, avatarUrl: true },
  });

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  res.json(user);
};

const editUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { newUsername, newPassword, avatarUrl, avatarPublicId } =
      req.body || {};

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, avatarPublicId: true },
    });
    if (!user) return res.status(404).json({ error: "user not found" });

    const dataToUpdate = {};

    if (typeof newUsername !== "undefined") {
      const username = String(newUsername).trim();
      if (!username)
        return res.status(400).json({ error: "username cannot be empty" });
      if (username !== user.username) dataToUpdate.username = username;
    }

    if (typeof newPassword === "string" && newPassword.trim() !== "") {
      dataToUpdate.password = await bcrypt.hash(newPassword.trim(), 10);
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
        user.avatarPublicId &&
        typeof avatarPublicId === "string" &&
        avatarPublicId.trim() &&
        user.avatarPublicId !== avatarPublicId
      ) {
        try {
          await cloudinary.uploader.destroy(user.avatarPublicId);
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

    const updated = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        avatarPublicId: true,
      },
    });

    return res.status(200).json({ user: updated });
  } catch (err) {
    console.error("editProfile failed:", err);
    return res.status(500).json({ error: "failed to update profile" });
  }
};

const deleteProfile = async (req, res) => {
  const userId = req.userId;
  await prisma.user.delete({ where: { id: userId } });

  res.status(204).send();
};

module.exports = {
  getCurrentUser,
  editUser,
  deleteProfile,
  getUserByUsername,
  getAllUsers,
};
