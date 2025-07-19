const http = require("http");
const app = require("./src/app");
const setupSocket = require("./src/socket/socket");
const PORT = process.env.PORT;

const server = http.createServer(app);

setupSocket(server);

server.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
