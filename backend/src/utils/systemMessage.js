const { MESSAGE_SELECT } = require("./messageUtils");

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

module.exports = { createSystemMessage };
