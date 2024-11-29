// app.js

const express = require("express");
const app = express();
const YAML = require("json-to-pretty-yaml");
const multer = require("multer");
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const os = require("os");
app.use(express.json());
const port = 25565;
const {
    ReadInit,
    CreateFileYAML,
    ReplaceData,
    TransformSheetData
} = require("./public/function/main");
const { Readable } = require("stream");

app.post("/", async (req, res) => {
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


app.post("/excel", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    const filePath = req.file.buffer;
    const workbook = XLSX.read(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const transformedData = TransformSheetData(sheetData); // call Func

    //INFO: generate yaml format from transformed data
    const fileData = await ReadInit();
    const { yamlData, fileName } = ReplaceData(fileData, {
        body: transformedData
    });
    const afterV1 = fileName.split("/v1/")[1] || "default";
    const fileNameWithExt = `${afterV1}.yaml`;

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileNameWithExt}"`
    );
    res.setHeader("Content-Type", "application/x-yaml");

    res.send(yamlData).end();
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
