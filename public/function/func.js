const e = require("express");
const XLSX = require("xlsx");
const archiver = require("archiver");
const YAML = require("json-to-pretty-yaml");
const util = require("util");
const {
  ReadInit,
  ReplaceData,
  TransformSheetData,
} = require("../function/main");
module.exports.checkRequest = function (key) {
  if (typeof key == "string" && key.includes("*")) {
    return true;
  } else {
    return false;
  }
};


module.exports.cutStarFormString = function (key) {
  if (typeof key == "string" && key.includes("*", 0))
    return key.replace(/\*/g, "");
  else return key;
};

module.exports.fixJSON = function (jsonString) {
  // jsonString = jsonString.replace('/\\r\\n/g',"")

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    const fixed = jsonString.trim().replace(/}+$/, "}").replace(/]+$/, "]");
    return JSON.parse(fixed);
  }
};

module.exports.cutStarFromObject = function (data) {
  if (Array.isArray(data)) {
    return data.map((element) => this.cutStarFromObject(element));
  } else if (typeof data === "string") {
    return data.replace(/\*/g, "");
  } else if (data && typeof data === "object") {
    const cleanedObject = {};
    for (const key in data) {
      if (this.checkRequest(data)) {
      }
      const cleanKey = key.replace(/\*/g, "");
      cleanedObject[cleanKey] = this.cutStarFromObject(data[key]);
    }

    return cleanedObject;
  }
};

module.exports.nestObject = function (object, structured = {}) {
  if (Array.isArray(object)) {
    structured = {
      type: "array",
      items: {},
    };

    if (object.length > 0) {
      structured.items = this.nestObject(object[0]);
    }
    return structured;
  } else if (typeof object === "object" && object !== null) {
    structured = {
      type: "object",
      properties: {},
      required: [],
    };

    for (const key in object) {
      const cleanKey = this.cutStarFormString(key);

      if (key.startsWith("*")) {
        structured.required.push(cleanKey);
      }

      structured.properties[cleanKey] = this.nestObject(object[key]);
    }
    if (structured.required.length === 0) {
      delete structured.required;
    }
    return structured;
  } else {
    return {
      type: typeof object,
    };
  }
};

module.exports.loopSheets = async function (filePath) {
  const workbook = XLSX.read(filePath);
  const sheetArray = workbook.SheetNames;

  const resultPromises = sheetArray.map(async (sheetName, index) => {
    //console.log(sheetName);

    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const metaSheet = sheetName.split("-");

    const transformedData = TransformSheetData(metaSheet, sheetData);
    // console.log("check : ",transformedData)

    return transformedData;
  });

  const results = await Promise.all(resultPromises);

  return results;
};

module.exports.LoopZipFile = async function (files = [], res) {
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  if (!!res) {
    archive.pipe(res);
  }

  for (const context of files) {
    const fileName = `${context?.info?.title}`;

    let yamlData = YAML.stringify(context, {
      replacer: (key, value) => {
       
        if (key.startsWith('@')) {
          return `'${value}'`;
        }
        return value;
      }
    });

    yamlData = yamlData.replace(/^( *)@([^:]+):/gm, "$1'@$2':");
    yamlData = yamlData.replace(/@(\w+)(?=:)/gm,"'@$1'")
    // console.log("log check YAML data:", util.inspect(yamlData, { showHidden: false, depth: null, colors: true }));

    archive.append(yamlData, { name: `${fileName}.yaml` });
  }

  await archive.finalize();
};

module.exports.isJson = function (item) {

  let value = typeof item !== "string" ? JSON.stringify(item) : item;

  try {
    value = JSON.parse(value);
  } catch (error) {
    return false;
  }

  return typeof value === "object" && value !== null;
}
