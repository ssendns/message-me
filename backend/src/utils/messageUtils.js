const prisma = require("./prisma");

const sanitizeText = (s) => {
  if (typeof s !== "string") return "";
  return s.trim();
};

const getOwnedMessageOrThrow = async (id, chatId, fromId) => {
  const message = await prisma.message.findUnique({ where: { id } });
  if (!message || message.chatId !== chatId || message.fromId !== fromId) {
    throw new Error("you cannot modify this message");
  }
  return message;
};

module.exports = { sanitizeText, getOwnedMessageOrThrow };
