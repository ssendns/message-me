const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");

router.get("/username/:username", userController.getUserId);
router.get("/all", authMiddleware, userController.getAllUsers);
router.patch("/edit", authMiddleware, userController.editProfile);
router.get("/", authMiddleware, userController.getProfile);
router.delete("/", authMiddleware, userController.deleteProfile);

module.exports = router;
