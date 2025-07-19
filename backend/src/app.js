const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const prisma = require("./utils/db");

const app = express();

const authRouter = require("./routes/authRouter");
const userRouter = require("./routes/userRouter");

app.use(cors());
app.use(express.json());

app.get("/test", async (req, res) => {
  console.log("hellooo");
  const users = await prisma.user.findMany();
  res.json(users);
});

app.use("/profile", userRouter);
app.use("/", authRouter);

module.exports = app;
