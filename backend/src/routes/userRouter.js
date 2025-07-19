const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");

router.get("/", authMiddleware, userController.getProfile);
router.patch("/edit", authMiddleware, userController.editProfile);
router.delete("/", authMiddleware, userController.deleteProfile);

module.exports = router;
