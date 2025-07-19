const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const PORT = process.env.PORT;
const { createMessage } = require("./src/utils/createMessage");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("user connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId.toString());
    console.log(`user ${userId} joined their room`);
  });

  socket.on("send_message", async ({ from, to, text }) => {
    console.log(`${from} → ${to}: ${text}`);
    await createMessage(from, to, text);
    io.to(to.toString()).emit("receive_message", { from, text });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
