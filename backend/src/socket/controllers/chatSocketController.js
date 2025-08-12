const prisma = require("../../utils/prisma");
const { privateKey } = require("../../utils/chatUtils");

const getOrCreateChat = async (user1, user2) => {
  const key = privateKey(user1, user2);
  const existing = await prisma.chat.findFirst({
    where: { privateKey: key },
    select: { id: true },
  });
  if (existing) return existing.id;

  try {
    const created = await prisma.chat.create({
      data: {
        type: "DIRECT",
        privateKey: key,
        participants: {
          create: [{ userId: user1 }, { userId: user2 }],
        },
      },
      select: { id: true },
    });
    return created.id;
  } catch (err) {
    // unique constraint failed
    if (err.code === "P2002") {
      const again = await prisma.chat.findFirst({
        where: { privateKey: key },
        select: { id: true },
      });
      if (again) return again.id;
    }
    throw err;
  }
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
  getOrCreateChat,
  getOtherUserIds,
};
