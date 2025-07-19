const prisma = require("../utils/db");
const bcrypt = require("bcryptjs");

const getProfile = async (req, res) => {
  const userId = req.user.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
    },
  });
  res.status(200).json({
    user: { id: user.id, username: user.username },
  });
};

const editProfile = async (req, res) => {
  const userId = req.user.userId;
  const dataToUpdate = {};
  const { newUsername, newPassword } = req.body;
  if (newUsername) dataToUpdate.username = newUsername;
  if (newPassword) dataToUpdate.password = await bcrypt.hash(newPassword, 10);

  if (Object.keys(dataToUpdate).length === 0) {
    return res.status(400).json({ error: "nothing to update" });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
  });

  res.status(200).json({
    user: { id: updated.id, username: updated.username },
  });
};

const deleteProfile = async (req, res) => {
  const userId = req.user.userId;
  await prisma.user.delete({ where: { id: userId } });

  res.status(204).send();
};

const getUserId = async (req, res) => {
  const { username } = req.params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true },
  });

  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  res.json(user);
};

module.exports = { getProfile, editProfile, deleteProfile, getUserId };
