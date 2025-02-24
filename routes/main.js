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
router.post("/", async (req, res) => {
    try {
        const fileData = await ReadInit();
        const yamlData = ReplaceData(fileData, req);
        const { prettierYaml, fileName } = YAML.stringify(yamlData);
        const afterV1 = fileName.split("/v1/")[1] || "default";
        const fileNameWithExt = `${afterV1}.yaml`;

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileNameWithExt}"`
        );
        res.setHeader("Content-Type", "application/x-yaml");

        const stream = new Readable();
        stream.push(prettierYaml);
        stream.push(null);

        stream.pipe(res);
    } catch (error) {
        // console.error("Error processing file:", error);
        res
            .status(500)
            .send({ message: "Error reading file", error: error.message });
    }
});

router.get('/swaggerUI', (req, res) => {
  const filePath = path.join(__dirname, '../swaggers/html/main.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      // console.error(err);
      res.status(500).send('Failed to load Swagger UI');
    }
  });
});
router.post("/excel", upload.single("file"), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        const filePath = req.file.buffer;

        const transformedData = await Func.loopSheets(filePath)
        // console.log(JSON.stringify(transformedData,null,2))
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
