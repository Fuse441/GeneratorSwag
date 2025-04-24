
const express = require("express");
const app = express();
const { ErrorHandler } = require("./src/middlewares/error.handler");
const core = require('cors')
const YAML = require('json-to-pretty-yaml');
const config = require('./src/configs/index')
const generateRoute = require('./src/routes/generateBE')
const logger = require('./src/middlewares/logger');

app.use(core())
app.use(express.json());
app.use(logger)
app.use(generateRoute)
app.use(ErrorHandler)

app.listen(config.PORT, () => {
    console.log(`Example app listening on port ${config.PORT}`);
});
