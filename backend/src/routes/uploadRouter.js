const express = require("express");
const multer = require("multer");
const cloudinary = require("../../cloudinary");
const fs = require("fs");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "no file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "chat_uploads",
      resource_type: "image",
    });

    fs.unlinkSync(req.file.path);

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error("upload failed:", err);
    res.status(500).json({ message: "upload failed" });
  }
});

module.exports = router;
