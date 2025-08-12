const { Server } = require("socket.io");
const messageController = require("./controllers/messageSocketController");
const chatController = require("./controllers/chatSocketController");
const validator = require("../validators/socketValidator");
const { ensureMember } = require("../utils/chatUtils");
const emitError = require("../utils/socketError");

const roomUser = (id) => `user_${id}`;
const roomChat = (id) => `chat_${id}`;

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  const onlineUsers = new Set();

  io.on("connection", (socket) => {
    // connection
    socket.on("join", (raw) => {
      const { userId } = validator.JoinSchema.parse(raw);
      socket.data.userId = Number(userId);
      socket.join(roomUser(userId));
      onlineUsers.add(String(userId));
      io.emit("user_online", userId);
      console.log(`user ${userId} is online`);
    });

    socket.on("disconnect", () => {
      const id = socket.data.userId;
      if (id != null) {
        onlineUsers.delete(String(id));
        io.emit("user_offline", id);
      }
    });

    socket.on("get_online_users", () => {
      socket.emit("online_users", Array.from(onlineUsers));
    });

    //chat features
    socket.on("get_or_create_chat", async (raw) => {
      try {
        const { peerId } = validator.GetOrCreateChatSchema.parse(raw);
        const currentUserId = Number(socket.data.userId);
        if (!currentUserId) throw new Error("unauthorized");

        const chatId = await chatController.getOrCreateChat(
          currentUserId,
          peerId
        );

        socket.join(roomChat(chatId));

        socket.emit("chat_ready", { chatId, peerId });
      } catch (err) {
        emitError(socket, err, "failed to get or create chat");
      }
    });

    socket.on("join_chat", async (raw) => {
      try {
        const { chatId } = validator.JoinChatSchema.parse(raw);
        const currentUserId = Number(socket.data.userId);
        await ensureMember(chatId, currentUserId);
        socket.join(roomChat(chatId));
      } catch (err) {
        emitError(socket, err, "failed to join chat");
      }
    });

    socket.on("leave_chat", (raw) => {
      try {
        const { chatId } = validator.JoinChatSchema.parse(raw);
        socket.leave(roomChat(chatId));
      } catch (err) {
        emitError(socket, err, "failed to leave chat");
      }
    });

    // message features
    socket.on("send_message", async (raw) => {
      try {
        const { chatId, text, imageUrl, imagePublicId } =
          validator.SendMessageSchema.parse(raw);
        const currentUserId = Number(socket.data.userId);
        await ensureMember(chatId, currentUserId);

        const payload = await messageController.createMessage(
          chatId,
          currentUserId,
          text,
          imageUrl,
          imagePublicId
        );

        io.to(roomChat(chatId)).emit("receive_message", payload);
        const others = await chatController.getOtherUserIds(
          chatId,
          currentUserId
        );
        [...others, currentUserId].forEach((uid) =>
          io.to(roomUser(uid)).emit("receive_message", payload)
        );
      } catch (err) {
        emitError(socket, err, "send_message failed");
      }
    });

    socket.on("edit_message", async (raw) => {
      try {
        const currentUserId = Number(socket.data.userId);
        const parsed = validator.EditMessageSchema.parse(raw);

        const {
          id: messageId,
          chatId,
          newText,
          newImageUrl,
          newImagePublicId,
        } = parsed;

        await ensureMember(chatId, currentUserId);

        const payload = await messageController.editMessage(
          messageId,
          chatId,
          currentUserId,
          newText,
          newImageUrl,
          newImagePublicId
        );

        io.to(roomChat(chatId)).emit("receive_edited_message", payload);
        const others = await chatController.getOtherUserIds(
          chatId,
          currentUserId
        );
        [...others, currentUserId].forEach((uid) =>
          io.to(roomUser(uid)).emit("receive_edited_message", payload)
        );
      } catch (err) {
        emitError(socket, err, "edit_message failed");
      }
    });

    socket.on("delete_message", async (raw) => {
      try {
        const currentUserId = Number(socket.data.userId);
        const { id, chatId } = validator.DeleteMessageSchema.parse(raw);

        await ensureMember(chatId, currentUserId);

        const payload = await messageController.deleteMessage(
          id,
          chatId,
          currentUserId
        );

        io.to(roomChat(chatId)).emit("message_deleted", payload);

        const others = await chatController.getOtherUserIds(
          chatId,
          currentUserId
        );

        for (const uid of [...others, currentUserId]) {
          const unreadCount = await messageController.countUnreadForUser(
            chatId,
            uid
          );
          io.to(roomUser(uid)).emit("message_deleted", {
            ...payload,
            unreadCount,
          });
        }
      } catch (err) {
        emitError(socket, err, "delete_message failed");
      }
    });

    socket.on("read_messages", async (raw) => {
      try {
        const currentUserId = Number(socket.data.userId);
        const { chatId } = validator.ReadMessagesSchema.parse(raw);

        await ensureMember(chatId, currentUserId);

        const payload = await messageController.markMessagesAsRead(
          chatId,
          currentUserId
        );

        io.to(roomChat(chatId)).emit("messages_read", payload);
        const others = await chatController.getOtherUserIds(
          chatId,
          currentUserId
        );
        [...others, currentUserId].forEach((uid) =>
          io.to(roomUser(uid)).emit("messages_read", payload)
        );
      } catch (err) {
        emitError(socket, err, "read_message failed");
      }
    });
  });
}

module.exports = setupSocket;
