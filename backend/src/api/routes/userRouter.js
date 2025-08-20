const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");

router.get("/username/:username", userController.getUserByUsername);
router.get("/all", authMiddleware, userController.getAllUsers);
router.patch("/edit", authMiddleware, userController.editUser);
router.get("/", authMiddleware, userController.getCurrentUser);
router.delete("/", authMiddleware, userController.deleteProfile);

module.exports = router;
