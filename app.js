// app.js

const express = require("express");
const app = express();
const YAML = require("json-to-pretty-yaml");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
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

function flattenObject(obj, prefix = "") {
  const flattened = {};

  for (const key in obj) {
    console.log("log for object : ", key + " = " + typeof obj[key]);
    if (Array.isArray(obj[key])) {
      for (const element of obj[key]) {
        console.log("log for elem : ", element);
      }
    }
  }
  return flattened;
}
function transformSheetData(sheetData) {
  const result = {
    title: "",
    version: "",
    description: "",
    contact: "",
    servers: [],
    paths: {},
  };

  let currentSection = "";
  let currentUri = "";
  let currentMethod = "";

  sheetData.forEach((element) => {
    if (element.Section) {
      currentSection = element.Section; // Update the current section
    } else {
      switch (currentSection) {
        case "Metadata":
          if (element.Key === "title") result.title = element.Value;
          if (element.Key === "version") result.version = element.Value;
          if (element.Key === "description") result.description = element.Value;
          if (element.Key === "contact") result.contact = element.Value;
          if (element.Key === "servers") result.servers.push(element.Value);
          if (element.Key === "uri") currentUri = element.Value;
          if (element.Key === "method") currentMethod = element.Value;
          if (currentUri && !result.paths[currentUri]) {
            result.paths[currentUri] = {};
          }
          if (currentUri && currentMethod) {
            result.paths[currentUri][currentMethod] = {
              tags: [],
              request: {
                header: {},
                body: {},
              },
              response: {},
            };
          }
          break;

        case "Header":
          if (currentUri && currentMethod) {
            result.paths[currentUri][currentMethod].request.header[
              element.Key
            ] = element.Value;
          }
          break;

        case "Body":
          if (currentUri && currentMethod) {
            const cleanJSON = element.Value.replace(/\\r\\n/g, "").trim();
            try {
              const parsedJSON = fixJSON(cleanJSON); // แก้ JSON ที่ไม่สมบูรณ์
              result.paths[currentUri][currentMethod].request.body[
                element.Key
              ] = parsedJSON;
            } catch (error) {
              console.error(
                "JSON parsing error:",
                error.message,
                "Clean JSON:",
                cleanJSON
              );
            }
          }
          break;

          case "Response":
            if (currentUri && currentMethod) {
                if (element.Key === "status") {
                    result.paths[currentUri][currentMethod].response[element.Value] = {}
                    
                }
                if(element.Key == "description") {
                    
                }
                } 
            
            break;
            

        
        default:
          break;
      }
    }
  });

  return result;
}
function fixJSON(jsonString) {
  try {
    return JSON.parse(jsonString); // ลองแปลง JSON ตรงๆ
  } catch (e) {
    // ลบตัวปิดที่เกินออกจากท้าย
    const fixed = jsonString.trim().replace(/}+$/, "}").replace(/]+$/, "]");
    return JSON.parse(fixed);
  }
}
app.post("/excel", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const filePath = req.file.path;
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  const transformedData = transformSheetData(sheetData);

  res.json({
    message: "File uploaded and processed successfully.",
    sheetData: sheetData,
    data: transformedData,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
