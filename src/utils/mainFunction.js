const XLSX = require("xlsx");
const { HTTP_METHOD } = require("../libs/constant/constant.method");
const {ValidationError} = require("../libs/exception/error.validation")
const Func = require("../utils/general");
const {OpenAPIBuilder} = require("../builders/SchemaBuilder")
export async function ReplaceData(content, request) {
    const result = await Promise.all(
      request.body.map(async (element) => {
        const builder = new OpenAPIBuilder(content, element);
        return builder.build();
      })
    );
    return result;
  }

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

 export function TransformSheetData(metaSheet, sheetData) {

    
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
          if(!Func.isJson(element.value))
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
            if(!Func.isJson(element.value) && !Func.isXml(element.value)) 
              throw new ValidationError({ message: `Invalid JSON Format on ${state.requestOrResponse} Body: ${state.currentMethod} ${state.currentUri} ${element.value}` })
            
            let parsedValue = element.value
     
            try {
              if (Func.isJson(element.value)) {
                parsedValue = JSON.parse(element.value);
              } else if (Func.isXml(element.value)) {
                parsedValue = Func.parseXml(element.value); 
              }
            } catch (err) {
              throw new ValidationError({
                message: `Error while parsing format on ${state.requestOrResponse} Body: ${state.currentMethod} ${state.currentUri}`
              });
            }
  
            result.paths[state.currentUri]["request"] = Object.assign(
              result.paths[state.currentUri]["request"] || {},
              {
                body: parsedValue,
              }
            );
            // 
          }
  
          if (state.isResponse) {
            if(!Func.isJson(element.value) && !Func.isXml(element.value)) 
              throw new ValidationError({ message:`Invalid JSON Format on ${state.requestOrResponse} Body: ${state.currentMethod} ${state.currentUri} ${element.value}` })
         
            let parsedValue = element.value

            try {
              if (Func.isJson(element.value)) {
                parsedValue = JSON.parse(element.value);
              } else if (Func.isXml(element.value)) {
                parsedValue = Func.parseXml(element.value); 
              }
            } catch (err) {
              throw new ValidationError({
                message: `Error while parsing format on ${state.requestOrResponse} Body: ${state.currentMethod} ${state.currentUri}`
              });
            }
            // parsedValue !== undefined &&  (parsedValue = JSON.parse(element.value));
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