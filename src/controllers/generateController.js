const generateService = require("../services/generateService");
const Func = require("../utils/functions");
exports.generate = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    const filePath = req.file.buffer;

    const transformedData = await Func.loopSheets(filePath);
    const fileData = await generateService.init();
    const yamlData = await Func.ReplaceData(fileData, {
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
