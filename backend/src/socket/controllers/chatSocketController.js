const prisma = require("../../utils/db");

async function getOrCreateChat(user1, user2) {
  const [u1, u2] = [Math.min(user1, user2), Math.max(user1, user2)];
  let chat = await prisma.chat.findFirst({
    where: {
      participants: { some: { userId: u1 } },
      AND: { participants: { some: { userId: u2 } } },
    },
    select: { id: true },
  });
  if (!chat) {
    chat = await prisma.chat.create({
      data: {
        participants: { create: [{ userId: u1 }, { userId: u2 }] },
      },
      select: { id: true },
    });
  }
  return chat.id;
}

async function getOtherUserIds(chatId, userId) {
  const participants = await prisma.chatParticipant.findMany({
    where: { chatId },
    select: { userId: true },
  });
  return participants.map((p) => p.userId).filter((uid) => uid !== userId);
}

module.exports = {
  getOrCreateChat,
  getOtherUserIds,
};
