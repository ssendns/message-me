const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const chatController = require("../controllers/chatApiController");
const groupController = require("../controllers/groupController");

router.delete(
  "/:chatId/participants/:userId",
  authMiddleware,
  groupController.removeParticipant
);
router.post(
  "/:chatId/participants",
  authMiddleware,
  groupController.addParticipant
);

router.post("/:chatId/admins", authMiddleware, groupController.promoteToAdmin);
router.delete(
  "/:chatId/admins/:userId",
  authMiddleware,
  groupController.demoteFromAdmin
);

router.get("/:chatId", authMiddleware, chatController.getChat);
router.patch("/:chatId", authMiddleware, groupController.editGroup);
router.delete("/:chatId", authMiddleware, groupController.deleteGroup);
router.get("/", authMiddleware, chatController.getAllChats);
router.post("/", authMiddleware, chatController.createChat);

module.exports = router;
