const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  ensureMember,
  requireGroup,
  requireAdminOrOwner,
  requireOwner,
} = require("../middlewares/chatAccessMiddleware");
const chatController = require("../controllers/chatApiController");
const groupController = require("../controllers/groupController");

router.use(authMiddleware);

router.post(
  "/:chatId/leave",
  ensureMember,
  requireGroup,
  groupController.leaveGroup
);

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
