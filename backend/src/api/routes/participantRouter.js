const express = require("express");
const router = express.Router({ mergeParams: true });
const authMiddleware = require("../middlewares/authMiddleware");
const participantController = require("../controllers/participantController");

router.delete(
  "/:userId",
  authMiddleware,
  participantController.removeParticipant
);
router.post("/", authMiddleware, participantController.addParticipant);

router.post("/admins", authMiddleware, participantController.promoteToAdmin);
router.delete(
  "/admins/:userId",
  authMiddleware,
  participantController.demoteFromAdmin
);

module.exports = router;
