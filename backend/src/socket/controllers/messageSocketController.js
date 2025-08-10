const prisma = require("../../utils/db");
const cloudinary = require("../../../cloudinary");

async function createMessage(chatId, fromId, text, imageUrl, imagePublicId) {
  if ((!text || !text.trim()) && !imageUrl) {
    throw new Error("message must have text or image");
  }
  const chatExists = await prisma.chat.findUnique({ where: { id: chatId } });
  const senderExists = await prisma.user.findUnique({ where: { id: fromId } });

  if (!chatExists || !senderExists) {
    throw new Error("user or receiver not found");
  }

  const message = await prisma.message.create({
    data: {
      chatId,
      fromId,
      text: text?.trim() || "",
      imageUrl: imageUrl || null,
      imagePublicId: imagePublicId || null,
      read: false,
    },
  });

  const fullMessage = {
    id: message.id,
    chatId,
    fromId: message.fromId,
    text: message.text,
    imageUrl: message.imageUrl,
    imagePublicId: message.imagePublicId,
    createdAt: message.createdAt,
    read: message.read,
    edited: message.edited,
  };

  return fullMessage;
}

async function editMessage(
  id,
  chatId,
  fromId,
  newText,
  newImageUrl,
  newImagePublicId
) {
  const chatExists = await prisma.chat.findUnique({ where: { id: chatId } });
  const senderExists = await prisma.user.findUnique({ where: { id: fromId } });

  if (!chatExists || !senderExists) {
    throw new Error("user or receiver not found");
  }
  if ((!newText || !newText.trim()) && !newImageUrl) {
    throw new Error("message must have text or image");
  }

  try {
    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing || existing.fromId !== fromId || existing.chatId !== chatId) {
      throw new Error("you can not edit this message");
    }

    const replacingImage = typeof newImageUrl !== "undefined";
    if (
      replacingImage &&
      existing.imagePublicId &&
      existing.imagePublicId !== newImagePublicId
    ) {
      try {
        await cloudinary.uploader.destroy(existing.imagePublicId);
      } catch (err) {
        console.warn("cloudinary destroy on edit failed:", err);
      }
    }

    const updated = await prisma.message.update({
      where: { id },
      data: {
        text: typeof newText === "string" ? newText.trim() : existing.text,
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
      chatId: updated.chatId,
      fromId: updated.fromId,
      text: updated.text,
      imageUrl: updated.imageUrl,
      imagePublicId: updated.imagePublicId,
      updatedAt: updated.updatedAt,
      edited: updated.edited,
    };

    return payload;
  } catch (err) {
    console.error("edit_message failed:", err);
  }
}

const deleteMessage = async (id, chatId, fromId) => {
  if (!id) {
    throw new Error("message id missing");
  }

  try {
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message || message.fromId !== fromId || message.chatId !== chatId) {
      throw new Error("you can not edit this message");
    }
    if (message.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(message.imagePublicId, {
          invalidate: true,
        });
      } catch (err) {
        console.warn("cloudinary destroy failed (will continue):", err);
      }
    }
    await prisma.message.delete({ where: { id } });

    const nextLast = await prisma.message.findFirst({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      select: { id: true, text: true, imageUrl: true, createdAt: true },
    });

    return {
      id,
      chatId,
      fromId,
      nextLast: nextLast
        ? {
            id: nextLast.id,
            text: nextLast.text ?? "",
            imageUrl: nextLast.imageUrl ?? null,
            createdAt: nextLast.createdAt,
          }
        : null,
    };
  } catch (err) {
    console.error("delete_message failed:", err);
  }
};

const markMessagesAsRead = async (chatId, readerId) => {
  await prisma.message.updateMany({
    where: {
      chatId,
      read: false,
      NOT: { fromId: readerId },
    },
    data: { read: true },
  });
  const payload = { chatId, readerId };
  return payload;
};

module.exports = {
  createMessage,
  deleteMessage,
  editMessage,
  markMessagesAsRead,
};
