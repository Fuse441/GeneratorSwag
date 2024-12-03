
const express = require("express");
const app = express();
app.use(express.json());
const port = 25565;
const cors = require('cors');
const mainRouter = require("./routes/main")
app.use(cors({
    methods: ['GET', 'POST'], 
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
const bodyParser = require('body-parser'); 

app.use(bodyParser.text({ type: 'text/plain' }));

app.use("/", mainRouter);


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
