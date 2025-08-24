const { SOCKET_EVENTS } = require("./socketEvents");

function emitError(socket, err, fallback) {
  socket.emit(SOCKET_EVENTS.ERROR, {
    message: err?.message || fallback || "an unexpected error occurred",
  });
}

module.exports = emitError;
