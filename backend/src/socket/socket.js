const { Server } = require("socket.io");
const validator = require("../validators/socketValidator");
const emitError = require("./socketError");
const { setIO, roomUser, roomChat } = require("./hub");
const { SOCKET_EVENTS } = require("./socketEvents");
const prisma = require("../utils/prisma");

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  setIO(io);

  const onlineUsers = new Set();

  io.on("connection", (socket) => {
    socket.on(SOCKET_EVENTS.JOIN, (raw) => {
      const { userId } = validator.JoinSchema.parse(raw);
      socket.data.userId = Number(userId);
      socket.join(roomUser(userId));
      onlineUsers.add(String(userId));
      io.emit(SOCKET_EVENTS.USER_ONLINE, userId);
    });

    socket.on("disconnect", () => {
      const id = socket.data.userId;
      if (id != null) {
        onlineUsers.delete(String(id));
        io.emit(SOCKET_EVENTS.USER_OFFLINE, id);
      }
    });

    socket.on(SOCKET_EVENTS.GET_ONLINE_USERS, () => {
      socket.emit(SOCKET_EVENTS.ONLINE_USERS, Array.from(onlineUsers));
    });

    socket.on(SOCKET_EVENTS.JOIN_CHAT, async (raw) => {
      try {
        const { chatId } = validator.JoinChatSchema.parse(raw);

        const currentUserId = Number(socket.data.userId);
        if (!currentUserId) throw new Error("unauthorized");
        const membership = await prisma.chatParticipant.findUnique({
          where: { chatId_userId: { chatId, userId: currentUserId } },
          select: { userId: true },
        });
        if (!membership) throw new Error("forbidden");

        socket.join(roomChat(chatId));
      } catch (err) {
        emitError(socket, err, "failed to join chat");
      }
    });

    socket.on(SOCKET_EVENTS.LEAVE_CHAT, (raw) => {
      try {
        const { chatId } = validator.JoinChatSchema.parse(raw);
        socket.leave(roomChat(chatId));
      } catch (err) {
        emitError(socket, err, "failed to leave chat");
      }
    });
  });
}

module.exports = setupSocket;
