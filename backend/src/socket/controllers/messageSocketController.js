const prisma = require("../../utils/prisma");
const cloudinary = require("../../../cloudinary");
const { ensureMember } = require("../../utils/chatUtils");
const {
  sanitizeText,
  getOwnedMessageOrThrow,
} = require("../../utils/messageUtils");

const createMessage = async (chatId, fromId, text, imageUrl, imagePublicId) => {
  await ensureMember(chatId, fromId);

  const cleanText = sanitizeText(text);
  const hasText = cleanText.length > 0;
  const hasImage = Boolean(imageUrl);
  if (!hasText && !hasImage) {
    throw new Error("message must have text or image");
  }

  const message = await prisma.message.create({
    data: {
      chatId,
      fromId,
      text: hasText ? cleanText : "",
      imageUrl: hasImage ? imageUrl : null,
      imagePublicId: imagePublicId || null,
      read: false,
    },
    select: {
      id: true,
      chatId: true,
      fromId: true,
      text: true,
      imageUrl: true,
      imagePublicId: true,
      createdAt: true,
      edited: true,
      read: true,
    },
  });

  return message;
};

const editMessage = async (
  id,
  chatId,
  fromId,
  newText,
  newImageUrl,
  newImagePublicId
) => {
  await ensureMember(chatId, fromId);

  const existing = await getOwnedMessageOrThrow(id, chatId, fromId);

  const nextTextDefined = typeof newText !== "undefined";
  const nextImageDefined = typeof newImageUrl !== "undefined";
  const cleanText = nextTextDefined ? sanitizeText(newText) : undefined;

  const finalText = nextTextDefined ? cleanText : existing.text ?? "";
  const finalImageUrl = nextImageDefined
    ? newImageUrl || null
    : existing.imageUrl || null;

  if (!finalText && !finalImageUrl) {
    throw new Error("message must have text or image");
  }

  const data = { edited: true };
  if (nextTextDefined) data.text = cleanText;
  if (nextImageDefined) data.imageUrl = newImageUrl || null;
  if (typeof newImagePublicId !== "undefined") {
    data.imagePublicId = newImagePublicId || null;
  }

  const updated = await prisma.message.update({
    where: { id },
    data,
    select: {
      id: true,
      chatId: true,
      fromId: true,
      text: true,
      imageUrl: true,
      imagePublicId: true,
      updatedAt: true,
      edited: true,
    },
  });

  const imageChanged =
    typeof newImagePublicId !== "undefined" &&
    existing.imagePublicId &&
    existing.imagePublicId !== (newImagePublicId || null);

  if (imageChanged) {
    try {
      await cloudinary.uploader.destroy(existing.imagePublicId);
    } catch (err) {
      console.warn("cloudinary destroy on edit failed:", err);
    }
  }

  return updated;
};

const deleteMessage = async (id, chatId, fromId) => {
  await ensureMember(chatId, fromId);
  const existing = await getOwnedMessageOrThrow(id, chatId, fromId);

  const [_, nextLast] = await prisma.$transaction([
    prisma.message.delete({ where: { id } }),
    prisma.message.findFirst({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      select: { id: true, text: true, imageUrl: true, createdAt: true },
    }),
  ]);

  if (existing.imagePublicId) {
    try {
      await cloudinary.uploader.destroy(existing.imagePublicId, {
        invalidate: true,
      });
    } catch (err) {
      console.warn("cloudinary destroy failed (will continue):", err);
    }
  }

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
};

const markMessagesAsRead = async (chatId, readerId) => {
  await ensureMember(chatId, readerId);
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

module.exports = {
  createMessage,
  deleteMessage,
  editMessage,
  markMessagesAsRead,
  countUnreadForUser,
};
