const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const messageController = require("../controllers/messageController");

router.post("/", authMiddleware, messageController.sendMessage);
router.delete("/:id", authMiddleware, messageController.deleteMessage);
router.get("/:toId", authMiddleware, messageController.getMessagesWithUser);

module.exports = router;
