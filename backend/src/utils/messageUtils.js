const prisma = require("./prisma");

const markMessagesAsRead = async (chatId, readerId) => {
  const result = await prisma.message.updateMany({
    where: {
      chatId,
      read: false,
      NOT: { fromId: readerId },
    },
    data: { read: true },
  });
  return { chatId, readerId, updated: result.count };
};

const countUnreadForUser = async (chatId, userId) => {
  return prisma.message.count({
    where: {
      chatId,
      read: false,
      NOT: { fromId: userId },
    },
  });
};

const MESSAGE_SELECT = {
  id: true,
  chatId: true,
  fromId: true,
  text: true,
  imageUrl: true,
  imagePublicId: true,
  read: true,
  edited: true,
  createdAt: true,
  updatedAt: true,
  type: true,
  meta: true,
};

module.exports = { markMessagesAsRead, countUnreadForUser, MESSAGE_SELECT };
