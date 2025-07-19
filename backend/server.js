const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const PORT = process.env.PORT;
const { createMessage, deleteMessage } = require("./src/utils/messageUtils");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("user connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId.toString());
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
      socket.emit("receive_message", fullMessage);
    } catch (err) {
      console.error("send_message failed:", err);
    }
  });

  socket.on("delete_message", (data) => {
    deleteMessage(data, socket, io);
  });

  socket.on("leave_chat", (chatUserId) => {
    socket.leave(`chat_${chatUserId}`);
    console.log(`user left chat room chat_${chatUserId}`);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
