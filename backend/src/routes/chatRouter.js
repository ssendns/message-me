const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const chatController = require("../controllers/chatController");

router.get("/:chatId", chatController.getChatMessages);
router.get("/", authMiddleware, chatController.getAllChats);

module.exports = router;
