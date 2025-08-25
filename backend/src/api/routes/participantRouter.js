const express = require("express");
const router = express.Router({ mergeParams: true });
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
const {
  parseTargetId,
  ensureTargetUserExists,
  ensureTargetMember,
  ensureTargetNotOwner,
} = require("../middlewares/targetParticipantMiddleware");
const participantController = require("../controllers/participantController");

router.use(ensureAutentification, ensureUserExists, ensureMember, requireGroup);

router.delete(
  "/:userId",
  requireAdminOrOwner,
  parseTargetId,
  ensureTargetUserExists,
  ensureTargetMember,
  ensureTargetNotOwner,
  participantController.removeParticipant
);
router.delete(
  "/admins/:userId",
  requireOwner,
  parseTargetId,
  ensureTargetUserExists,
  ensureTargetMember,
  ensureTargetNotOwner,
  participantController.demoteFromAdmin
);
router.post(
  "/admins",
  requireOwner,
  parseTargetId,
  ensureTargetUserExists,
  ensureTargetMember,
  ensureTargetNotOwner,
  participantController.promoteToAdmin
);
router.post(
  "/",
  requireAdminOrOwner,
  parseTargetId,
  ensureTargetUserExists,
  participantController.addParticipant
);

module.exports = router;
