// app.js
const express = require('express');
const app = express();
const YAML = require('json-to-pretty-yaml');

app.use(express.json());
const port = 25565;
const { ReadInit, CreateFileYAML, ReplaceData } = require('./public/function/main'); 

app.post('/', async (req, res) => {
    try {
        const fileData = await ReadInit(); 
    // console.log(req.body.title);
     const {yamlData,fileName} = ReplaceData(fileData,req)
    //  console.log(yamlData, fileName);
     CreateFileYAML(yamlData,fileName);
   
        res.send({message : "YAML file created successfully"});
    } catch (error) {
        console.error("Error processing file:", error); 
        res.status(500).send({ message: "Error reading file", error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
