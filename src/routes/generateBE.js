const express = require("express");
const router = express.Router();
const generateController = require("../controllers/generateController");
const multer = require("multer");
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });

router.post("/generate",upload.single("file"), generateController.generate);

module.exports = router;
