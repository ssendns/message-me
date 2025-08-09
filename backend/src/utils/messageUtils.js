const prisma = require("./db");
const cloudinary = require("../../cloudinary");

async function createMessage(from, to, text, imageUrl, imagePublicId) {
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
      imagePublicId: imagePublicId || null,
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
    if (message.imagePublicId) {
      try {
        console.log("deleting image with publicId:", message.imagePublicId);
        await cloudinary.uploader.destroy(message.imagePublicId, {
          invalidate: true,
        });
        console.log("cloudinary delete result:", message.imagePublicId);
      } catch (e) {
        console.warn(
          "cloudinary destroy failed (will continue):",
          e?.message || e
        );
      }
    }
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

async function editMessage(
  { id, userId, newText, newImageUrl, newImagePublicId },
  socket,
  io
) {
  if ((!newText || !newText.trim()) && !newImageUrl) {
    throw new Error("message must have text or image");
  }
  try {
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing || existing.fromId !== userId) {
      socket.emit("error", "you can not edit this message");
      return;
    }

    const replacingImage = typeof newImageUrl !== "undefined";
    if (
      replacingImage &&
      existing.imagePublicId &&
      existing.imagePublicId !== newImagePublicId
    ) {
      try {
        console.log("deleting image with publicId:", existing.imagePublicId);
        const result = await cloudinary.uploader.destroy(
          existing.imagePublicId
        );
        console.log("cloudinary delete result:", result);
      } catch (e) {
        console.warn("cloudinary destroy on edit failed:", e?.message || e);
      }
    }

    const updated = await prisma.message.update({
      where: { id },
      data: {
        content:
          typeof newText === "string" ? newText.trim() : existing.content,
        imageUrl:
          typeof newImageUrl !== "undefined" ? newImageUrl : existing.imageUrl,
        imagePublicId:
          typeof newImagePublicId !== "undefined"
            ? newImagePublicId
            : existing.imagePublicId,
        edited: true,
      },
    });

    const payload = {
      id: updated.id,
      fromId: updated.fromId,
      toId: updated.toId,
      content: updated.content,
      imageUrl: updated.imageUrl,
      imagePublicId: updated.imagePublicId,
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
