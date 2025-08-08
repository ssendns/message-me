const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const prisma = require("./utils/db");

const app = express();

const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");
const messageRouter = require("./routes/messageRouter");
const uploadRouter = require("./routes/uploadRouter");

app.use(cors());
app.use(express.json());

app.get("/test", async (req, res) => {
  console.log("hellooo");
  const users = await prisma.user.findMany();
  res.json(users);
});

app.use("/profile", userRouter);
app.use("/messages", messageRouter);
app.use("/upload", uploadRouter);
app.use("/", authRouter);

module.exports = app;
