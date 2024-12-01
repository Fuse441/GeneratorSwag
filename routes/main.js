const express = require("express");
const router = express.Router();
const YAML = require("json-to-pretty-yaml");
const multer = require("multer");
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });

const { Readable } = require("stream");
const Func = require("../public/function/func")
const {
    ReadInit,
    ReplaceData,
    TransformSheetData
} = require("../public/function/main");

// Route for JSON to YAML
router.post("/", async (req, res) => {
    try {
        const fileData = await ReadInit();
        const { yamlData, fileName } = ReplaceData(fileData, req);
        const afterV1 = fileName.split("/v1/")[1] || "default";
        const fileNameWithExt = `${afterV1}.yaml`;

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileNameWithExt}"`
        );
        res.setHeader("Content-Type", "application/x-yaml");

        const stream = new Readable();
        stream.push(yamlData);
        stream.push(null);

        stream.pipe(res);
    } catch (error) {
        console.error("Error processing file:", error);
        res
            .status(500)
            .send({ message: "Error reading file", error: error.message });
    }
});

// Route for Excel to YAML
router.post("/excel", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    const filePath = req.file.buffer;
  
    const transformedData = await Func.loopSheets(filePath)
   
    const fileData = await ReadInit();

    const yamlData  = await ReplaceData(fileData, {
      body: transformedData,
    });
    // const afterV1 = fileName.split("/v1/")[1] || "default";
    // const fileNameWithExt = `${afterV1}.yaml`;

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="test"`
    );
    res.setHeader("Content-Type", "application/x-yaml");

    res.send(yamlData).end();
});

module.exports = router;
