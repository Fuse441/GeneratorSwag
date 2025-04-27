const GenerateService = require("../services/generateService");
const Func = require("../utils/general");
const Main = require("../utils/mainFunction")
exports.generate = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    const filePath = req.file.buffer;

    const transformedData = await Main.loopSheets(filePath);
    const fileData = await GenerateService.init();
    const yamlData = await Main.ReplaceData(fileData, {
      body: transformedData,
    });
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=SwaggerFile.zip"
    );
    res.setHeader("Content-Type", "application/zip");

    const archived = await Func.LoopZipFile(yamlData, res);

    res.end(archived);
  } catch (error) {
  console.log("error ==> ", error);

    next(error);
  }
};
