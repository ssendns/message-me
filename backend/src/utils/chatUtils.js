const prisma = require("./prisma");

const privateKey = (a, b) => {
  const user1 = Math.min(a, b);
  const user2 = Math.max(a, b);
  return `${user1}:${user2}`;
};

const ensureMember = async (chatId, userId) => {
  const chat = await prisma.chat.findFirst({
    where: { id: chatId, participants: { some: { userId } } },
    select: { id: true },
  });
  if (!chat) {
    const err = new Error("forbidden");
    err.status = 403;
    throw err;
  }
};

const getRole = async (chatId, userId) => {
  return prisma.chatParticipant.findUnique({
    where: { chatId_userId: { chatId, userId } },
    select: { role: true },
  });
};

const isOwner = (role) => role === "OWNER";
const isAdminOrOwner = (role) => role === "ADMIN" || role === "OWNER";

module.exports = {
  privateKey,
  ensureMember,
  getRole,
  isOwner,
  isAdminOrOwner,
};
