const e = require("express");
const XLSX = require("xlsx");
const { ReadInit,
  ReplaceData,
  TransformSheetData
} = require("../function/main");
const fs = require("fs");
const YAML = require("json-to-pretty-yaml");
const archiver = require("archiver");
const path = require("path");
module.exports.checkRequest = function (key) {
    if (typeof key == "string" && key.includes('*')) {
        return true
    } else {
        return false
    }
};

module.exports.cutStarFormString = function (key) {
    if (typeof key == "string" && key.includes('*', 0))
        return key.replace(/\*/g, "")
    else return key
}

module.exports.fixJSON = function (jsonString) {
  // jsonString = jsonString.replace('/\\r\\n/g',"")

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    const fixed = jsonString.trim().replace(/}+$/, "}").replace(/]+$/, "]");
    return JSON.parse(fixed);
  }
}


module.exports.cutStarFromObject = function (data) {
    if (Array.isArray(data)) {
      return data.map(element => this.cutStarFromObject(element));
    } else if (typeof data === "string") {
        
      return data.replace(/\*/g, "");
    } else if (data && typeof data === "object") {
      const cleanedObject = {};
      for (const key in data) {
        if(this.checkRequest(data)) {

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
            type: typeof object 
        };
    }
};



module.exports.loopSheets = async function (filePath) {
  const workbook = XLSX.read(filePath);
  const sheetArray = workbook.SheetNames;


  const resultPromises = sheetArray.map(async (sheetName, index) => {
    console.log(sheetName);

    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const metaSheet = sheetName.split("-");

    const transformedData = TransformSheetData(metaSheet, sheetData);
    // console.log("check : ",transformedData)
 

    return transformedData; 
  });

  const results = await Promise.all(resultPromises);

  return results;
};

module.exports.CreateFileYAML =  async function(content) {

  if (!content || !Array.isArray(content)) {
    console.error("No valid content provided to CreateFileYAML");
    return;
  }

  const temp = content.map(item => Object.keys(item.paths)[0]);
  const fileNames = temp.map(item => item.split("/v1")[1])
  const files = []


    content.forEach((element,index) => {
        const yamlString = YAML.stringify(element);    

        try {
          fs.writeFileSync(`swaggers/files/${fileNames[index]}.yaml`, yamlString);
          files.push(fileNames[index])
        } catch (err) {
          console.error("Error writing file:", err);
          throw err;
        }
      });
      return files
}


module.exports.CreateFileZIP = async function (files) {
  const dirFile = `${path.resolve(__dirname, "..", "..")}/swaggers/files`;
  const outputFilePath = `${dirFile}/example.zip`;

 
  if (!fs.existsSync(dirFile)) {
    throw new Error(`Directory not found: ${dirFile}`);
  }


  const output = fs.createWriteStream(outputFilePath);
  const archive = archiver("zip", {
    zlib: { level: 9 }, 
  });

  return new Promise((resolve, reject) => {
    output.on("close", () => {
      console.log(`ZIP file created: ${outputFilePath}`);
      resolve(outputFilePath);
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    try {
      
      const filePath = `${dirFile}/${files[0]}.yaml`; 
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      archive.append(fs.createReadStream(filePath), { name: `${files[0]}.yaml` });

      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
};

