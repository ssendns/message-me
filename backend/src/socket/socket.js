const { Server } = require("socket.io");
const {
  createMessage,
  deleteMessage,
  editMessage,
} = require("../utils/messageUtils");

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
    console.log("user connected:", socket.id);

    socket.on("join", (userId) => {
      socket.data.userId = userId.toString();
      socket.join(userId.toString());
      onlineUsers.add(userId.toString());
      io.emit("user_online", userId);
      console.log(`user ${userId} is online`);
    });

    socket.on("join_chat", (chatUserId) => {
      socket.join(`chat_${chatUserId}`);
      console.log(`user joined chat room with user ${chatUserId}`);
    });

    socket.on("send_message", async ({ from, to, text }) => {
      console.log(`${from} → ${to}: ${text}`);
      try {
        const message = await createMessage(from, to, text);
        const fullMessage = {
          id: message.id,
          fromId: message.fromId,
          toId: message.toId,
          content: message.content,
          createdAt: message.createdAt,
        };

        io.to(to.toString()).emit("receive_message", fullMessage);
        io.to(from.toString()).emit("receive_message", fullMessage);
      } catch (err) {
        console.error("send_message failed:", err);
      }
    });

    socket.on("edit_message", (data) => {
      editMessage(data, socket, io);
    });

    socket.on("delete_message", (data) => {
      deleteMessage(data, socket, io);
    });

    socket.on("leave_chat", (chatUserId) => {
      socket.leave(`chat_${chatUserId}`);
      console.log(`user left chat room chat_${chatUserId}`);
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
