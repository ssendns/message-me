const express = require("express");
const router = express.Router({ mergeParams: true });
const authMiddleware = require("../middlewares/authMiddleware");
const {
  ensureMember,
  requireGroup,
  requireAdminOrOwner,
  requireOwner,
} = require("../middlewares/chatAccessMiddleware");
const participantController = require("../controllers/participantController");

router.use(authMiddleware, ensureMember, requireGroup);

router.delete(
  "/:userId",
  requireAdminOrOwner,
  participantController.removeParticipant
);
router.post("/", requireAdminOrOwner, participantController.addParticipant);

router.post("/admins", requireOwner, participantController.promoteToAdmin);
router.delete(
  "/admins/:userId",
  requireOwner,
  participantController.demoteFromAdmin
);

module.exports = router;
