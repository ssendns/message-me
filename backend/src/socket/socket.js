const { Server } = require("socket.io");
const messageController = require("./controllers/messageSocketController");
const chatController = require("./controllers/chatSocketController");
const prisma = require("../utils/db");

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
    socket.on("join", ({ userId }) => {
      socket.data.userId = userId.toString();
      socket.join(userId.toString());
      onlineUsers.add(userId.toString());
      io.emit("user_online", userId);
      console.log(`user ${userId} is online`);
    });

    socket.on("get_or_create_chat", async ({ peerId }) => {
      try {
        const currentUserId = Number(socket.data.userId);
        if (!currentUserId || !peerId) return;

        const chatId = await chatController.getOrCreateChat(
          currentUserId,
          Number(peerId)
        );
        socket.emit("chat_ready", { chatId, peerId: Number(peerId) });
        console.log("chat created");
      } catch (e) {
        console.error("get_or_create_chat failed:", e);
        socket.emit("error", { message: "failed to get or create chat" });
      }
    });

    socket.on("join_chat", async ({ chatId }) => {
      socket.join(`chat_${chatId}`);
      console.log(`user joined chat ${chatId}`);
    });

    socket.on(
      "send_message",
      async ({ chatId, text, imageUrl, imagePublicId }) => {
        const fromId = Number(socket.data.userId);
        if (!fromId) return;
        console.log(`${chatId}: ${text}`);
        try {
          const payload = await messageController.createMessage(
            chatId,
            fromId,
            text,
            imageUrl,
            imagePublicId
          );
          const otherUsers = await chatController.getOtherUserIds(
            chatId,
            fromId
          );
          otherUsers.forEach((uid) => {
            io.to(uid.toString()).emit("receive_message", payload);
          });
          io.to(fromId.toString()).emit("receive_message", payload);
        } catch (err) {
          console.error("send_message failed:", err);
        }
      }
    );

    socket.on(
      "edit_message",
      async ({ id, chatId, newText, newImageUrl, newImagePublicId }) => {
        const fromId = Number(socket.data.userId);
        try {
          const payload = await messageController.editMessage(
            id,
            chatId,
            fromId,
            newText,
            newImageUrl,
            newImagePublicId
          );
          const otherUsers = await chatController.getOtherUserIds(
            chatId,
            fromId
          );
          otherUsers.forEach((uid) => {
            io.to(uid.toString()).emit("receive_edited_message", payload);
          });
          io.to(fromId.toString()).emit("receive_edited_message", payload);
        } catch (err) {
          console.error("edit_message failed:", err);
        }
      }
    );

    socket.on("delete_message", async ({ id, chatId }) => {
      const fromId = Number(socket.data.userId);
      try {
        const payload = await messageController.deleteMessage(
          id,
          chatId,
          fromId
        );
        const otherUsers = await chatController.getOtherUserIds(chatId, fromId);
        for (const uid of otherUsers) {
          const unreadCount = await prisma.message.count({
            where: {
              chatId,
              read: false,
              fromId: { not: uid },
            },
          });
          io.to(uid.toString()).emit("message_deleted", {
            ...payload,
            unreadCount,
          });
        }
        io.to(fromId.toString()).emit("message_deleted", payload);
      } catch (err) {
        console.error("delete_message failed:", err);
      }
    });

    socket.on("leave_chat", (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`user left chat room chat_${chatId}`);
    });

    socket.on("read_messages", async ({ chatId }) => {
      try {
        const readerId = Number(socket.data.userId);
        if (!readerId || !chatId) return;

        const payload = await messageController.markMessagesAsRead(
          chatId,
          readerId
        );

        const others = await chatController.getOtherUserIds(chatId, readerId);
        others.forEach((uid) => {
          io.to(uid.toString()).emit("messages_read", payload);
        });
        io.to(readerId.toString()).emit("messages_read", payload);
      } catch (err) {
        console.error("failed to mark messages as read:", err);
      }
    });

    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      if (userId) {
        onlineUsers.delete(userId);
        io.emit("user_offline", userId);
        console.log(`user ${userId} disconnected`);
      } else {
        console.log(`socket ${socket.id} disconnected without userId`);
      }
    });

    socket.on("get_online_users", () => {
      socket.emit("online_users", Array.from(onlineUsers));
    });
  });
}

module.exports = setupSocket;
