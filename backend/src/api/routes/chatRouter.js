const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const chatController = require("../controllers/chatApiController");

router.delete(
  "/:chatId/participants/:userId",
  authMiddleware,
  chatController.removeParticipant
);
router.post(
  "/:chatId/participants",
  authMiddleware,
  chatController.addParticipant
);

router.get("/:chatId", chatController.getChatMessages);
router.patch("/:chatId", authMiddleware, chatController.updateChat);
router.delete("/:chatId", authMiddleware, chatController.deleteChat);
router.get("/", authMiddleware, chatController.getAllChats);
router.post("/", authMiddleware, chatController.createChat);

module.exports = router;
