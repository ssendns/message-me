function emitError(socket, err, fallback) {
  socket.emit("error", {
    message: err?.message || fallback || "an unexpected error occurred",
  });
}

module.exports = emitError;
