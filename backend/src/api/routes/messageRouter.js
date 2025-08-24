const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  ensureAutentification,
  ensureUserExists,
} = require("../middlewares/authMiddleware");
const { ensureMember } = require("../middlewares/chatAccessMiddleware");
const { ensureOwnMessage } = require("../middlewares/messageAccessMiddleware");
const messageController = require("../controllers/messageController");

router.use(ensureAutentification, ensureUserExists, ensureMember);

router.get("/", messageController.getChatMessages);
router.post("/", messageController.createMessage);
router.patch("/:messageId", ensureOwnMessage, messageController.updateMessage);
router.delete("/:messageId", ensureOwnMessage, messageController.deleteMessage);

module.exports = router;
