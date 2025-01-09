
const express = require("express");
const app = express();
const { ErrorHandler } = require("./middleware/error.handler");

app.use(express.json());
const port = 25565;

app.use(express.static("public"));

const mainRouter = require("./routes/main");

app.use("/", mainRouter);

app.use(ErrorHandler)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
