const express = require("express");
const router = express.Router();
const {
  ensureAutentification,
  ensureUserExists,
} = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");

router.get("/username/:username", userController.getUserByUsername);
router.get(
  "/all",
  ensureAutentification,
  ensureUserExists,
  userController.getAllUsers
);
router.patch(
  "/edit",
  ensureAutentification,
  ensureUserExists,
  userController.editUser
);
router.get(
  "/",
  ensureAutentification,
  ensureUserExists,
  userController.getCurrentUser
);
router.delete(
  "/",
  ensureAutentification,
  ensureUserExists,
  userController.deleteProfile
);

module.exports = router;
