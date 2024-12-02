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
    TransformSheetData,
    CreateFileYAML
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
  
    try {
      const filePath = req.file.buffer;
  
      // ประมวลผลข้อมูล
      const transformedData = await Func.loopSheets(filePath);
      const fileData = await ReadInit();
  
      const yamlData = await ReplaceData(fileData, {
        body: transformedData,
      });
  
    
      await Func.CreateFileYAML(yamlData);
  
  
      const zipFilePath = await Func.CreateFileZIP();
  
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="example.zip"`
      );
      res.setHeader("Content-Type", "application/zip");
      
      res.sendFile(zipFilePath, (err) => {
       
        if (err) {
          console.error("Error sending file:", err);
          res.status(500).send("Error sending file.");
        }
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("An error occurred.");
    }
  });
  
module.exports = router;
