const { getIO, roomUser, roomChat } = require("./hub");
const chatController = require("../controllers/chatSocketController");

async function broadcastChatAndInboxes(chatId, userId, event, payload) {
  const io = getIO();
  if (!io) return;

  io.to(roomChat(chatId)).emit(event, payload);

  const others = await chatController.getOtherUserIds(chatId, userId);
  [...others, actorId].forEach((uid) =>
    io.to(roomUser(uid)).emit(event, payload)
  );
}

module.exports = { broadcastChatAndInboxes };
