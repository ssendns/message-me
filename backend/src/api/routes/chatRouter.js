const express = require("express");
const router = express.Router();
const {
  ensureAutentification,
  ensureUserExists,
} = require("../middlewares/authMiddleware");
const {
  ensureMember,
  requireGroup,
  requireAdminOrOwner,
  requireOwner,
} = require("../middlewares/chatAccessMiddleware");
const chatController = require("../controllers/chatController");
const groupController = require("../controllers/groupController");

router.use(ensureAutentification, ensureUserExists);

router.post(
  "/:chatId/leave",
  ensureMember,
  requireGroup,
  groupController.leaveGroup
);
router.patch("/:chatId/read", ensureMember, chatController.markRead);
router.get("/:chatId", ensureMember, chatController.getChat);
router.patch(
  "/:chatId",
  ensureMember,
  requireGroup,
  requireAdminOrOwner,
  groupController.editGroup
);
router.delete(
  "/:chatId",
  ensureMember,
  requireGroup,
  requireOwner,
  groupController.deleteGroup
);
router.get("/", chatController.getAllChats);
router.post("/", chatController.createChat);

module.exports = router;
