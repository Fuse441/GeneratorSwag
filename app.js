
const express = require("express");
const app = express();
app.use(express.json());
const port = 25565;

const mainRouter = require("./routes/main")

app.use("/", mainRouter);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
