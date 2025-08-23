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

async function createSystemMessage(
  prisma,
  { chatId, action, userId = null, targetId = null, extra = {} }
) {
  const meta = { action, userId, targetId, ...extra };
  const text = "";

  const message = await prisma.message.create({
    data: {
      chatId,
      fromId: userId,
      text,
      type: "SYSTEM",
      meta,
      read: false,
    },
    select: MESSAGE_SELECT,
  });

  return message;
}

module.exports = { createSystemMessage, MESSAGE_SELECT };
