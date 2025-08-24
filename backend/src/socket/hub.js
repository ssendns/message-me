const { getOtherUserIds } = require("../utils/chatUtils");

let io = null;

function setIO(_io) {
  io = _io;
}

function getIO() {
  if (!io)
    throw new Error("socket.IO instance is not set. call setIO(io) first");
  return io;
}

const roomUser = (id) => `user_${id}`;
const roomChat = (id) => `chat_${id}`;

function emitToChat(chatId, event, payload) {
  getIO().to(roomChat(chatId)).emit(event, payload);
}

function emitToUser(userId, event, payload) {
  getIO().to(roomUser(userId)).emit(event, payload);
}

function emitToUsers(userIds, event, payload) {
  if (!userIds || userIds.length === 0) return;
  for (const uid of userIds || []) {
    getIO().to(roomUser(uid)).emit(event, payload);
  }
}

async function emitToChatAndUsers(chatId, initiatorUserId, event, payload) {
  emitToChat(chatId, event, payload);
  const others = await getOtherUserIds(chatId, initiatorUserId);
  emitToUsers([...others, initiatorUserId], event, payload);
}

module.exports = {
  setIO,
  getIO,
  roomUser,
  roomChat,
  emitToChat,
  emitToUser,
  emitToUsers,
  emitToChatAndUsers,
};
