const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const chatController = require("../controllers/chatApiController");
const groupController = require("../controllers/groupController");

router.post("/:chatId/leave", authMiddleware, groupController.leaveGroup);

router.get("/:chatId", authMiddleware, chatController.getChat);
router.patch("/:chatId", authMiddleware, groupController.editGroup);
router.delete("/:chatId", authMiddleware, groupController.deleteGroup);
router.get("/", authMiddleware, chatController.getAllChats);
router.post("/", authMiddleware, chatController.createChat);

module.exports = router;
