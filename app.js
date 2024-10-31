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
     const Result = ReplaceData(fileData,req)
     CreateFileYAML(Result);
   
        res.send(Result);
    } catch (error) {
        console.error("Error processing file:", error); 
        res.status(500).send({ message: "Error reading file", error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
