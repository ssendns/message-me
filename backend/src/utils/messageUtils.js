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

async function editMessage({ id, userId, newContent }, socket, io) {
  try {
    const existing = await prisma.message.findUnique({ where: { id } });

    if (!existing || existing.fromId !== userId) {
      socket.emit("error", "you can not edit this message");
      return;
    }

    const updated = await prisma.message.update({
      where: { id },
      data: {
        content: newContent,
        edited: true,
      },
    });

    const payload = {
      id: updated.id,
      fromId: updated.fromId,
      toId: updated.toId,
      content: updated.content,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      edit: updated.edited,
    };

    io.to(updated.toId.toString()).emit("receive_edited_message", payload);
    io.to(updated.fromId.toString()).emit("receive_edited_message", payload);
  } catch (err) {
    console.error("edit_message failed:", err);
    socket.emit("error", "message edit failed");
  }
}

module.exports = { createMessage, deleteMessage, editMessage };
