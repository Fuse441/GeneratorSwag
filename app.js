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

app.post('/excel', (req, res) => {
    try {
        const dataToWrite = Array.isArray(req.body)
            ? req.body.map((item) => flattenObject(item))
            : [flattenObject(req.body)];

        const sheetData = XLSX.utils.json_to_sheet(dataToWrite);
        const WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(WorkBook, sheetData, "Sheet1");

        const outputPath = path.join(__dirname, 'output.xlsx');
        XLSX.writeFile(WorkBook, outputPath);

        res.json({
            message: "File uploaded and processed successfully.",
            filePath: outputPath,
        });
    } catch (error) {
        console.error('Error processing Excel:', error);
        res.status(500).json({
            message: 'An error occurred while processing the Excel file.',
            error: error.message,
        });
    }
});
  
  


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
