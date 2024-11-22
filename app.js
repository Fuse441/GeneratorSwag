// app.js

const express = require('express');
const app = express();
const YAML = require('json-to-pretty-yaml');
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const os = require('os');
app.use(express.json());
const port = 25565;
const { ReadInit, CreateFileYAML, ReplaceData } = require('./public/function/main'); 
const { Readable } = require('stream');

app.post('/', async (req, res) => {
    try {
        const fileData = await ReadInit();
        const { yamlData, fileName } = ReplaceData(fileData, req);
        const afterV1 = fileName.split('/v1/')[1] || 'default';
        const fileNameWithExt = `${afterV1}.yaml`;

        res.setHeader('Content-Disposition', `attachment; filename="${fileNameWithExt}"`);
        res.setHeader('Content-Type', 'application/x-yaml');

        const stream = new Readable();
        stream.push(yamlData); 
                stream.push(null); 

      
        stream.pipe(res);

    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).send({ message: "Error reading file", error: error.message });
    }
});





function flattenObject(obj, prefix = '') {
    const flattened = {};
 
    for (const key in obj) {
        console.log("log for object : ",key +  " = " +  typeof obj[key])
       if(Array.isArray(obj[key])) { 
            for (const element of obj[key]) {
                console.log("log for elem : ", element)
            }
       }
    }
    return flattened;
}

app.post('/excel', upload.single('file'), (req, res) => {
   
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; 
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // ส่งข้อมูลที่ได้กลับไป
    res.json({
        message: "File uploaded and processed successfully.",
        data: sheetData
    });
});
  
  


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
