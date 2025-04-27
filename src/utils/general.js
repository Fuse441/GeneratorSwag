const XLSX = require("xlsx");
const archiver = require("archiver");
const { HTTP_METHOD } = require("../libs/constant/constant.method");
const YAML = require("json-to-pretty-yaml");
const {ValidationError} = require("../libs/exception/error.validation")
const { XMLParser } = require('fast-xml-parser');


export function parseXml(item) {
    
 const parser = new XMLParser()
 try {
    const jsonObj = parser.parse(item);
    return jsonObj
 } catch (error) {

  return error
 }

}
export function isXml(item) {
// console.log("item ==> ", item);

 const parser = new XMLParser()
 try {
    const jsonObj = parser.parse(item);

    return JSON.stringify(jsonObj) ? true : false
 } catch (error) {

  return false
 }


}
export function isJson (item) {

    let value = typeof item !== "string" ? JSON.stringify(item) : item;
  
    try {
      value = JSON.parse(value);
    } catch (error) {
      return false;
    }
  
    return typeof value === "object" && value !== null;
  }
  


  export function checkRequest(key) {
    if (typeof key == "string" && key.includes("*")) {
      return true;
    } else {
      return false;
    }
  };
  
  
  export function cutStarFormString  (key) {
    if (typeof key == "string" && key.includes("*", 0))
      return key.replace(/\*/g, "");
    else return key;
  };
  
  export function fixJSON  (jsonString) {
    // jsonString = jsonString.replace('/\\r\\n/g',"")
  
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      const fixed = jsonString.trim().replace(/}+$/, "}").replace(/]+$/, "]");
      return JSON.parse(fixed);
    }
  };
  
  export function cutStarFromObject (data) {
    // 
    if (Array.isArray(data)) {
      return data.map((element) => cutStarFromObject(element));
    } else if (typeof data === "string") {
      // 
      return data.replace(/\*/g, "");
    } else if (data && typeof data === "object") {
      const cleanedObject = {};
      for (const key in data) {
        if (checkRequest(data)) {
        }
        const cleanKey = key.replace(/\*/g, "");
        cleanedObject[cleanKey] = cutStarFromObject(data[key]);
      }
  
      return cleanedObject;
    }
  };
export async function  LoopZipFile (files = [], res) {
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
  
      // 
  
      archive.append(yamlData, { name: `${fileName}.yaml` });
    }
  
    await archive.finalize();
  };
  
  export function nestObject (object, structured = {}) {
    // 
    if (Array.isArray(object)) {
      // 
      structured = {
        type: "array",
        items: {},
      };
  
      if (object.length > 0) {
      
        structured.items = nestObject(object[0]);
      }
      return structured;
    } else if (typeof object === "object" && object !== null) {
      structured = {
        type: "object",
        properties: {},
        required: [],
      };
  
      for (const key in object) {
        const cleanKey = cutStarFormString(key);
        // 
        if (key.startsWith("*")) {
          structured.required.push(cleanKey);
        }
  
        structured.properties[cleanKey] = nestObject(object[key]);
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