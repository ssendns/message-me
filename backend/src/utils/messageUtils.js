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

const deleteMessage = async ({ id, userId }, socket, io) => {
  if (!id || !userId) {
    console.error("deleteMessage: id or userId missing");
    return;
  }

  try {
    const message = await prisma.message.findUnique({ where: { id } });

    if (!message || message.fromId !== userId) {
      return;
    }

    const toId = message.toId;
    const fromId = message.fromId;

    await prisma.message.delete({ where: { id } });

    io.to(fromId.toString()).emit("delete_message", { messageId: id });
    io.to(toId.toString()).emit("delete_message", { messageId: id });
    socket.emit("delete_message", { messageId: id });
  } catch (err) {
    console.error("delete_message failed:", err);
  }
};

module.exports = { createMessage, deleteMessage };
