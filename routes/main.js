const express = require("express");
const router = express.Router();
const YAML = require("json-to-pretty-yaml");
const multer = require("multer");
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });
const XLSX = require("xlsx");
const { Readable } = require("stream");
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
    const workbook = XLSX.read(filePath);
    const sheetName = workbook.SheetNames[1];
    
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const metaSheet = sheetName.split('-');
    
  
     const transformedData = TransformSheetData(metaSheet,sheetData);

    // const fileData = await ReadInit();
    // const { yamlData, fileName } = ReplaceData(fileData, {
    //     body: transformedData
    // });
    // const afterV1 = fileName.split("/v1/")[1] || "default";
    // const fileNameWithExt = `${afterV1}.yaml`;

    // res.setHeader(
    //     "Content-Disposition",
    //     `attachment; filename="${fileNameWithExt}"`
    // );
    // res.setHeader("Content-Type", "application/x-yaml");

    res.send(transformedData).end();
});

module.exports = router;
