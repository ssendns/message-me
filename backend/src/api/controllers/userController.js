const prisma = require("../../utils/prisma");
const bcrypt = require("bcryptjs");
const cloudinary = require("../../../cloudinary");

const getProfile = async (req, res) => {
  const userId = req.user.userId;
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

const editProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { newUsername, newPassword, avatarUrl, avatarPublicId } =
      req.body || {};

    const dataToUpdate = {};

    if (typeof newUsername === "string" && newUsername.trim() !== "") {
      dataToUpdate.username = newUsername.trim();
    }

    if (typeof newPassword === "string" && newPassword.trim() !== "") {
      dataToUpdate.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    if (typeof avatarUrl !== "undefined") {
      dataToUpdate.avatarUrl = avatarUrl || null;
    }

    if (typeof avatarPublicId !== "undefined") {
      dataToUpdate.avatarPublicId = avatarPublicId || null;
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
  const userId = req.user.userId;
  await prisma.user.delete({ where: { id: userId } });

  res.status(204).send();
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

const getAllUsers = async (req, res) => {
  const userId = req.user.userId;
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

const addAvatar = async (req, res) => {
  const userId = Number(req.user.userId);
  const { imageUrl, imagePublicId } = req.body || {};

  if (!imageUrl || !imagePublicId) {
    return res
      .status(400)
      .json({ message: "imageUrl and imagePublicId are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true },
    });

    if (user?.avatarPublicId && user.avatarPublicId !== imagePublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (e) {
        console.warn("avatar destroy failed:", e);
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: imageUrl, avatarPublicId: imagePublicId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        avatarPublicId: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "failed to add avatar" });
  }
};

const deleteAvatar = async (req, res) => {
  const userId = Number(req.user.userId);
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true },
    });

    if (user?.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId, {
          invalidate: true,
        });
      } catch (e) {
        console.warn("avatar destroy failed:", e);
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null, avatarPublicId: null },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        avatarPublicId: true,
      },
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: "failed to remove avatar" });
  }
};

module.exports = {
  getProfile,
  editProfile,
  deleteProfile,
  getUserByUsername,
  getAllUsers,
  addAvatar,
  deleteAvatar,
};
