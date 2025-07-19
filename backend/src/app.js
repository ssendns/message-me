const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const prisma = require("./utils/db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/test", async (req, res) => {
  console.log("hellooo");
  const users = await prisma.user.findMany();
  res.json(users);
});

module.exports = app;
