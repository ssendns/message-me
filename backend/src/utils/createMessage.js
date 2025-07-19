const prisma = require("./db");

async function createMessage(from, to, content) {
  const userExists = await prisma.user.findUnique({ where: { id: from } });
  const receiverExists = await prisma.user.findUnique({ where: { id: to } });

  if (!userExists || !receiverExists) {
    throw new Error("user or receiver not found");
  }
  return await prisma.message.create({
    data: {
      fromId: from,
      toId: to,
      content,
    },
  });
}

module.exports = { createMessage };
