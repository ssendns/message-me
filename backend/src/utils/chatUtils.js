const prisma = require("./prisma");

const privateKey = (a, b) => {
  const user1 = Math.min(a, b);
  const user2 = Math.max(a, b);
  return `${user1}:${user2}`;
};

const getOtherUserIds = async (chatId, userId) => {
  const rows = await prisma.chatParticipant.findMany({
    where: {
      chatId,
      NOT: { userId },
    },
    select: { userId: true },
  });
  return rows.map((row) => row.userId);
};

module.exports = {
  privateKey,
  getOtherUserIds,
};
