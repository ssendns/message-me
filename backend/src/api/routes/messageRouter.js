const express = require("express");
const router = express.Router({ mergeParams: true });
const authMiddleware = require("../middlewares/authMiddleware");
const messageController = require("../controllers/messageApiController");

router.get("/", authMiddleware, messageController.getChatMessages);
router.post("/", authMiddleware, messageController.createMessage);
router.patch("/:messageId", authMiddleware, messageController.updateMessage);
router.delete("/:messageId", authMiddleware, messageController.deleteMessage);

module.exports = router;
