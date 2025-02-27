const express = require("express");
const router = express.Router();
const YAML = require("json-to-pretty-yaml");
const multer = require("multer");
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });
const path = require('path')
const { Readable } = require("stream");
const Func = require("../public/function/func")

const {
    ReadInit,
    ReplaceData,
} = require("../public/function/main");


// Route for JSON to YAML

router.post("/excel", upload.single("file"), async (req, res, next) => {

    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }
        const filePath = req.file.buffer;

        const transformedData = await Func.loopSheets(filePath)
        // 
        const fileData = await ReadInit();

        const yamlData = await ReplaceData(fileData, {
            body: transformedData,
        });

        res.setHeader("Content-Disposition", 'attachment; filename=SwaggerFile.zip');
        res.setHeader("Content-Type", "application/zip");

        const archived = await Func.LoopZipFile(yamlData, res)
        res.end()

    } catch (error) {
        next(error)
    }
});

module.exports = router;
