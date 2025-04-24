// app.js
const express = require('express');
const app = express();
const YAML = require('json-to-pretty-yaml');
const config = require('./src/configs/index')
const generateRoute = require('./src/routes/generateBE')

const port = 25565;
const { ReadInit, CreateFileYAML, ReplaceData } = require('./public/function/main'); 
const logger = require('./src/middlewares/logger');

app.use(express.json());
app.use(logger)
app.use(generateRoute)


app.listen(config.PORT, () => {
    console.log(`Example app listening on port ${config.PORT}`);
});
