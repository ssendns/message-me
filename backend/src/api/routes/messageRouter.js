const express = require("express");
const router = express.Router({ mergeParams: true });
const authMiddleware = require("../middlewares/authMiddleware");
const { ensureMember } = require("../middlewares/chatAccessMiddleware");
const { ensureOwnMessage } = require("../middlewares/messageAccessMiddleware");
const messageController = require("../controllers/messageApiController");

router.use(authMiddleware, ensureMember);

router.get("/", messageController.getChatMessages);
router.post("/", messageController.createMessage);
router.patch("/:messageId", ensureOwnMessage, messageController.updateMessage);
router.delete("/:messageId", ensureOwnMessage, messageController.deleteMessage);

module.exports = router;
