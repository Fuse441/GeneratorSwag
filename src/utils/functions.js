const XLSX = require("xlsx");
const archiver = require("archiver");
const { HTTP_METHOD } = require("../libs/constant/constant.method");
const YAML = require("json-to-pretty-yaml");
export async function loopSheets  (filePath) {
    const workbook = XLSX.read(filePath);
    const sheetArray = workbook.SheetNames;
    const resultPromises = sheetArray
    .filter((item) => item.includes("-"))
    .map(async (sheetName, index) => {   
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        console.warn(`Sheet not found: ${sheetName}`);
        return null; 
      }
      const sheetData = XLSX.utils.sheet_to_json(sheet);
      const metaSheet = sheetName.split("-");
      const transformedData = TransformSheetData(metaSheet, sheetData);

        return transformedData;    
    });
    const results = await Promise.all(resultPromises);
    return results;
  };
export async function ReplaceData(content, request) {
    const mapYAML = request.body.map(async (element) => {
      const obj = JSON.parse(JSON.stringify(content));
      let fileName = "";
      obj.info.title = element.title;
      
      obj.info.version = element.version;
      obj.info.description = element.description;
      obj.info.contact = element.contact;
      obj.servers = element.servers.map((item) => ({ url: item }));
      obj.paths = {};
     
      for (let key in element.paths) {
       
        var pathUri = key;
        // console.log("pathUri ==> ", pathUri);
       
        fileName = pathUri;
        const method = element.paths[key].method
          .toLowerCase()
          .replace(/['"]+/g, "");
        obj.paths[key] = {
          [method]: {
            tags: [],
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {},
                    required: [],
                  },
                  example: {},
                },
              },
            },
            parameters: [],
            responses: {},
          },
        };
        obj.paths[key][method].tags = element.paths[key].tags;
        
        const pathParam = Array.from(key.matchAll(/{(\w+)}/gm))
        const queryParam = Array.from(key.matchAll(/(\*?\w+)=([^&]+)/gm))
       
       
        
        queryParam.length != 0 && queryParam.forEach(item => {
        
        
          const objectParamerter = {
            in: "query",
            name: cutStarFormString(item[1]),
            schema: {
              type: typeof item[2],
            },
            required: item[1].includes("*"),
            description: cutStarFormString(item[2]),
          };
          obj.paths[key][method].parameters.push(objectParamerter);
        })
        pathParam.length != 0 && pathParam.forEach(item => {
          const objectParamerter = {
            in: "path",
            name: cutStarFormString(item[1]),
            schema: {
              type: typeof item[1],
            },
            required: true,
            description: cutStarFormString(item[1]),
          };
          obj.paths[key][method].parameters.push(objectParamerter);
  
        });
  
  
        for (const item in element.paths[key].request.header) {
          
          const objectParamerter = {
            in: "header",
            name: cutStarFormString(item),
            schema: {
              type: typeof item,
            },
            required: checkRequest(item),
            description: cutStarFormString(item),
          };
          obj.paths[key][method].parameters.push(objectParamerter);
        }
      
        for (const item in element.paths[key].request.body) {
         
          let newItem;
        
          item.includes("*")
            ? (newItem = item.replace(/\*/g, ""))
            : (newItem = item);
          
          const value = element.paths[key].request.body[item];
          //  
          // 
          //  
          if (cutStarFromObject(item) != item){
            //  
            obj.paths[key][method].requestBody.content[
              "application/json"
            ].schema.required.push(newItem);
          }
  
          obj.paths[key][method].requestBody.content[
            "application/json"
          ].schema.properties[newItem] = nestObject(value);
          obj.paths[key][method].requestBody.content["application/json"].example[
            newItem
          ] = cutStarFromObject(value);
     
        }
        // 
        if (
          obj.paths[key][method].requestBody.content["application/json"].schema
            .required.length == 0
        ) {
          delete obj.paths[key][method].requestBody.content["application/json"]
            .schema.required;
        }
  
        for (const item in element.paths[key].response) {
          const responseData = {
            description: element.paths[key].response[item].description,
        
            headers: {},
  
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {},
                  required: [],
                },
                example: {},
              },
            },
          };
  
          const res = element.paths[key].response[item];
          for (const key in res.request.header) {
            const value = res.request.header[key];
            const objectHeader = {
              description: cutStarFormString(key),
              required: checkRequest(key),
              schema: {
                type: typeof value,
                example: value,
              },
            };
            responseData.headers[cutStarFormString(key)] = objectHeader;
          }
          res.request.body == undefined && (res.request.body = {})
          if (Object.keys(res.request.body).length != 0 && res.request.body != undefined) {
            for (const key in res.request.body) {
              const value = res.request.body[key];
              
              if (checkRequest(key)) {
                responseData.content["application/json"].schema.required.push(
                  cutStarFromObject(key)
                );
              }
              responseData.content["application/json"].example[
                cutStarFormString(key)
              ] = cutStarFromObject(value);
              
              responseData.content["application/json"].schema.properties[
                cutStarFormString(key)
              ] = nestObject(value);
            }
          }
  
          (responseData.content["application/json"].schema.required.length == 0 || res.request.body == undefined) &&
            delete responseData.content["application/json"].schema.required;
  
          method === "get" &&
            delete  obj.paths[key][method].requestBody
  
          try {
            obj.paths[key][method].responses[`"${item}"`] = responseData;
            //  obj.paths[key]
  
          } catch (error) {
            throw new ValidationError({ message: ` ${error}`})
  
            // 
          }
        }
      }
    
      Object.keys(obj.paths).forEach(element => {
      console.log("element ==> ", element);
        
      });
      return obj;
    });
  
    const result = await Promise.all(mapYAML);
  
    return result;
  }
function isJson (item) {

    let value = typeof item !== "string" ? JSON.stringify(item) : item;
  
    try {
      value = JSON.parse(value);
    } catch (error) {
      return false;
    }
  
    return typeof value === "object" && value !== null;
  }
  
function TransformSheetData(metaSheet, sheetData) {

    
    const [title, version] = metaSheet;
  
    const result = {
      title: title,
      version: version,
      tags: [],
      description: "",
      contact: "",
      servers: [],
      paths: {},
    };
  
    const state = {
      currentUri: null,
      currentMethod: null,
      currentHttpStatus: null,
      isRequest: false,
      isResponse: false,
      requestOrResponse: null,
      startQuery : null
    };
    const actions = new Map([
      [
        "tag",
        (key, element) => {
          if(!!!element.value)
              throw new ValidationError({ message: `Please Provide Tag: ${state.currentMethod} ${state.currentUri}`})
          result.tags.push(element.value);
        },
      ],
      [
        "description",
        (key, element) => {
          if(!!!element.value)
              throw new ValidationError({ message: `Please Provide ${state.requestOrResponse} Description: ${state.currentMethod} ${state.currentUri}`})
          const description = element.value;
          if (!state.isResponse) {
            result.description = description;
          } else {
            result.paths[state.currentUri]["response"][state.currentHttpStatus][
              "description"
            ] = description;
          }
        },
      ],
      [
        "reference",
        (key, element) =>
        { 
          if(!!!element.value)
            throw new ValidationError({ message: `Invalid template in Sheet ${title} :  ${key}`,details : `${element.value} must be String@Link`})
  
          if (element.value !== undefined && element.value.includes("@")) {
            const [name, url] = element.value.split("@");
            result.contact = { name, url };
          }else{
            delete result.contact
          }
        }
      ],
      [
        "servers",
        (key, element) => {
          if(!!!element.value)
              throw new ValidationError({ message: `Please Provide Server: ${state.currentMethod} ${state.currentUri}`})
          let parts = null;
          element.value != undefined && (parts = element.value.split(/\r\n|\n/)) 
  
          const newArray = (parts != null) && parts.map((item) => item.replace("@", "")) || [];
          result.servers.push(...newArray);
        },
      ],
      [
        "uri",
        (key, element) => {
          if(!!!element.value)
              throw new ValidationError({ message: `Please Provide URI: ${state.currentMethod} ${state.currentUri}`})
          state.currentUri = element.value;
        },
      ],
      [
        "query",
        (key, element) => {
     
  
          
          if(!!!element.value || !element.value.includes("="))
            throw new ValidationError({ message: `Error Format Query String` , details : `${key} : ${element.value}`})
  
            if(!state.startQuery){
              state.currentUri &&= state.currentUri.concat("?",element.value)
              state.startQuery ||= true
  
            }else{
              state.currentUri &&= state.currentUri.concat("&",element.value)
              
            }
            
         
        },
      ],
      [
        "method",
        (key, element) => {
          console.log("element.value ==> ", element.value);

          if(!!!element.value)
              throw new ValidationError({ message: `Please Provide Method: ${state.currentUri}`})
          if(!HTTP_METHOD.includes(element.value))
              throw new ValidationError({ message: `Invalid Method: ${element.value}`,details : `Must be one of [${HTTP_METHOD}]`})
          result.paths[state.currentUri] = {};
          Object.assign(result.paths[state.currentUri], {
            method: element.value,
            tags: result.tags,
          });
          delete result.tags;
          state.currentMethod = element.value;
        },
      ],
      [
        "Request",
        (key, element) => {
          state.isRequest = true;
          state.isResponse = false;
          state.requestOrResponse = "Request"
        },
      ],
      [
        "Response",
        (key, element) => {
          state.isResponse = true;
          state.isRequest = false;
          state.requestOrResponse = "Response"
        },
      ],
      [
        "header",
        (key, element) => {
          if(!!!element.value)
              throw new ValidationError({ message: `Please Provide ${state.requestOrResponse} Header: ${state.currentMethod} ${state.currentUri}`})
          if(!isJson(element.value))
              throw new ValidationError({ message: `Invalid JSON Format ${state.requestOrResponse} Header: ${state.currentMethod} ${state.currentUri} ${element.value}` })
          
          let parsedValue = element.value
          parsedValue != undefined &&  (parsedValue = JSON.parse(element.value));
  
          if (state.isRequest) {
            result.paths[state.currentUri]["request"] = Object.assign(
              result.paths[state.currentUri]["request"] || {},
              {
                header: parsedValue,
              }
            );
          }
  
          if (state.isResponse) {
            result.paths[state.currentUri]["response"][state.currentHttpStatus][
              "request"
            ] = {
              ...result.paths[state.currentUri]["response"][
                state.currentHttpStatus
              ]["request"],
              header: parsedValue,
            };
          }
        },
      ],
      [
        "body",
        (key, element) => {
        
          if (state.isRequest) {
            if(state.currentMethod == "GET")
              return;
            if(!!!element.value)
              throw new ValidationError({ message: `Please Provide ${state.requestOrResponse} Body: ${state.currentMethod} ${state.currentUri}`})
            if(!isJson(element.value)) 
              throw new ValidationError({ message: `Invalid JSON Format on ${state.requestOrResponse} Body: ${state.currentMethod} ${state.currentUri} ${element.value}` })
  
            let parsedValue = element.value
            parsedValue != undefined &&  (parsedValue = JSON.parse(element.value));
  
            result.paths[state.currentUri]["request"] = Object.assign(
              result.paths[state.currentUri]["request"] || {},
              {
                body: parsedValue,
              }
            );
            // 
          }
  
          if (state.isResponse) {
            if(!isJson(element.value)) 
              throw new ValidationError({ message:`Invalid JSON Format on ${state.requestOrResponse} Body: ${state.currentMethod} ${state.currentUri} ${element.value}` })
         
            let parsedValue = element.value
         
            parsedValue !== undefined &&  (parsedValue = JSON.parse(element.value));
            result.paths[state.currentUri]["response"][state.currentHttpStatus][
              "request"
            ] = {
              ...result.paths[state.currentUri]["response"][
                state.currentHttpStatus
              ]["request"],
              body: parsedValue,
            };
          }
        },
      ],
      [
        "http status",
        (key, element) => {
          if(!!!element.value)
              throw new ValidationError({ message: `Please Provide ${state.requestOrResponse} HTTP Status: ${state.currentMethod} ${state.currentUri}`})
          if(isNaN(element?.value))
              throw new ValidationError({ message: `HTTP Status must be number: ${state.currentMethod} ${state.currentUri}`})
  
          state.currentHttpStatus = String(element.value);
          result.paths[state.currentUri]["response"] = {
            ...result.paths[state.currentUri]["response"],
            [element.value]: {},
          };
        },
      ],
    ]);
  
    sheetData.forEach((element) => {
      const action = actions.get(element.key);
      if (action) {
        action(element.key.toLowerCase(), element);
      }
    });
  
    return result;
  }

  function checkRequest(key) {
    if (typeof key == "string" && key.includes("*")) {
      return true;
    } else {
      return false;
    }
  };
  
  
  function cutStarFormString  (key) {
    if (typeof key == "string" && key.includes("*", 0))
      return key.replace(/\*/g, "");
    else return key;
  };
  
  function fixJSON  (jsonString) {
    // jsonString = jsonString.replace('/\\r\\n/g',"")
  
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      const fixed = jsonString.trim().replace(/}+$/, "}").replace(/]+$/, "]");
      return JSON.parse(fixed);
    }
  };
  
  function cutStarFromObject (data) {
    // 
    if (Array.isArray(data)) {
      return data.map((element) => this.cutStarFromObject(element));
    } else if (typeof data === "string") {
      // 
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
  
  function nestObject (object, structured = {}) {
    // 
    if (Array.isArray(object)) {
      // 
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
        // 
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