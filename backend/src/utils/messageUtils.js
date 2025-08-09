const prisma = require("./db");

async function createMessage(from, to, text, imageUrl) {
  if ((!text || !text.trim()) && !imageUrl) {
    throw new Error("message must have text or image");
  }
  const userExists = await prisma.user.findUnique({ where: { id: from } });
  const receiverExists = await prisma.user.findUnique({ where: { id: to } });

  if (!userExists || !receiverExists) {
    throw new Error("user or receiver not found");
  }
  return await prisma.message.create({
    data: {
      fromId: from,
      toId: to,
      content: text?.trim() || "",
      imageUrl: imageUrl || null,
    },
  });
}

const deleteMessage = async ({ id }, socket, io) => {
  if (!id) {
    console.error("deleteMessage: id missing");
    return;
  }

  try {
    const message = await prisma.message.findUnique({ where: { id } });

    if (!message) return;

    const { fromId, toId } = message;

    await prisma.message.delete({ where: { id } });

    const payloadForFrom = {
      messageId: id,
      chatId: toId,
      userId: fromId,
    };

    const payloadForTo = {
      messageId: id,
      chatId: fromId,
      userId: toId,
    };

    io.to(fromId.toString()).emit("delete_message", payloadForFrom);
    io.to(toId.toString()).emit("delete_message", payloadForTo);
    socket.emit("delete_message", payloadForFrom);
  } catch (err) {
    console.error("delete_message failed:", err);
  }
};

async function editMessage({ id, userId, newText, newImageUrl }, socket, io) {
  if ((!newText || !newText.trim()) && !newImageUrl) {
    throw new Error("message must have text or image");
  }
  try {
    const existing = await prisma.message.findUnique({ where: { id } });

    if (!existing || existing.fromId !== userId) {
      socket.emit("error", "you can not edit this message");
      return;
    }

    const updated = await prisma.message.update({
      where: { id },
      data: {
        content: newText?.trim() || "",
        imageUrl: newImageUrl || null,
        edited: true,
      },
    });

    const payload = {
      id: updated.id,
      fromId: updated.fromId,
      toId: updated.toId,
      content: updated.content,
      imageUrl: updated.imageUrl,
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

const markMessagesAsRead = async (fromId, toId) => {
  await prisma.message.updateMany({
    where: {
      fromId,
      toId,
      hasUnread: true,
    },
    data: {
      hasUnread: false,
    },
  });
};

module.exports = {
  createMessage,
  deleteMessage,
  editMessage,
  markMessagesAsRead,
};
