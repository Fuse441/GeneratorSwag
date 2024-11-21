// app.js

const express = require('express');
const app = express();
const YAML = require('json-to-pretty-yaml');
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const XLSX = require('xlsx');
const path = require('path');

app.use(express.json());
const port = 25565;
const { ReadInit, CreateFileYAML, ReplaceData } = require('./public/function/main'); 
const { pbkdf2 } = require('crypto');

app.post('/', async (req, res) => {
    try {
        const fileData = await ReadInit(); 
     const {yamlData,fileName} = ReplaceData(fileData,req)
     CreateFileYAML(yamlData,fileName);
   
        res.send({message : "YAML file created successfully"});
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
    // ตรวจสอบว่าไฟล์มีอยู่หรือไม่
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // อ่านไฟล์ Excel
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[2]; // เลือกชีตแรก
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
