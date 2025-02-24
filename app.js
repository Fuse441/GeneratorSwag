
const express = require("express");
const app = express();
const { ErrorHandler } = require("./middleware/error.handler");
const core = require('cors')
app.use(express.json());
const port = 25565;

app.use(express.static("public"));
app.use(core())
const mainRouter = require("./routes/main");

app.use("/", mainRouter);

app.use(ErrorHandler)

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
