const express = require("express");
const router = express.Router();
const generateController = require("../controllers/generateController");


router.post("/users", generateController.generate);

module.exports = router;
