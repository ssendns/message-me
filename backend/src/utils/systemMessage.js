const prisma = require("../prisma");

async function createSystemMessage({
  chatId,
  userId = null,
  action,
  targetId = null,
  old = null,
  _new = null,
}) {
  return prisma.message.create({
    data: {
      chatId,
      fromId: userId,
      kind: "SYSTEM",
      meta: { action, targetId, old, new: _new },
      text: "",
    },
  });
}

module.exports = { createSystemMessage };
