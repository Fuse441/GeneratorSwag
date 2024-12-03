const { application, response } = require("express");
const fs = require("fs");
const YAML = require("json-to-pretty-yaml");
const appError = require("../../swaggers/structured/appError.json");
const { type } = require("os");
const e = require("express");
const Func = require("../function/func");

function ReadInit() {
  return new Promise((resolve, reject) => {
    fs.readFile("swaggers/structured/openapi.json", "utf8", (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        return reject(err);
      }
      try {
        const jsonData = JSON.parse(data);

        resolve(jsonData);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        reject(parseError);
      }
    });
  });
}

async function ReplaceData(content, request) {

  const mapYAML = request.body.map(async (element) => {

  const obj = JSON.parse(JSON.stringify(content));
  let fileName = "";
  obj.info.title = element.title;
  obj.info.version = element.version;
  obj.info.description = element.description;
  obj.info.contact = element.contact;
  obj.servers = element.servers.map((item) => ({ url: item }));
  obj.paths = {};
     
      for (const key in element.paths) {
    fileName = key;
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

    for (const item in element.paths[key].request.header) {
      const objectParamerter = {
        in: "header",
        name: Func.cutStarFormString(item),
        schema: {
          type: typeof item,
        },
        required: Func.checkRequest(item),
        description: Func.cutStarFormString(item),
      };
      obj.paths[key][method].parameters.push(objectParamerter);
    }
       for (const item in element.paths[key].request.body) {
      let newItem;
      item.includes("*")
        ? (newItem = item.replace(/\*/g, ""))
        : (newItem = item);

      const value = element.paths[key].request.body[item];
      // console.log("log nest : ", JSON.stringify(Func.nestObject(value)))

      if (Func.checkRequest(item))
        obj.paths[key][method].requestBody.content[
          "application/json"
        ].schema.required.push(newItem);

      obj.paths[key][method].requestBody.content[
        "application/json"
      ].schema.properties[newItem] = Func.nestObject(value);
      obj.paths[key][method].requestBody.content["application/json"].example[
        newItem
      ] = Func.cutStarFromObject(value);
    }
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
          description: Func.cutStarFormString(key),
          required: Func.checkRequest(key),
          schema: {
            type: typeof value,
            example: value,
          },
        };
        responseData.headers[Func.cutStarFormString(key)] = objectHeader;
      }

      if (Object.keys(res.request.body).length != 0) {
        for (const key in res.request.body) {
          const value = res.request.body[key];

          if (Func.checkRequest(key)) {
            responseData.content["application/json"].schema.required.push(
              Func.cutStarFromObject(key)
            );
          }
          responseData.content["application/json"].example[
            Func.cutStarFormString(key)
          ] = Func.cutStarFromObject(value);
          responseData.content["application/json"].schema.properties[
            Func.cutStarFormString(key)
          ] = Func.nestObject(value);
        }
      } 
      if(responseData.content["application/json"].schema.required.length == 0)
        delete responseData.content["application/json"].schema.required


     
      try {
        obj.paths[key][method].responses[item] = responseData;
      } catch (error) {
        console.log("catch : ", error);
      }
    }
  }
    
  console.log("==>" ,obj)
  return obj
  }
  
 )

 const result = await Promise.all(mapYAML)
 
return  result
}




 
  
  
  // }
  

  // const obj = JSON.parse(JSON.stringify(content));
  // let fileName = "";
  // obj.info.title = element.title;
  // obj.info.version = requests.body.version;
  // obj.info.description = requests.body.description;
  // obj.info.contact = requests.body.contact;

  // obj.servers = requests.body.servers.map((item) => ({ url: item }));

  // obj.paths = {};
  // for (const key in requests.body.paths) {
  //   fileName = key;
  //   const method = requests.body.paths[key].method
  //     .toLowerCase()
  //     .replace(/['"]+/g, "");
  //   obj.paths[key] = {
  //     [method]: {
  //       tags: [],
  //       requestBody: {
  //         content: {
  //           "application/json": {
  //             schema: {
  //               type: "object",
  //               properties: {},
  //               required: [],
  //             },
  //             example: {},
  //           },
  //         },
  //       },
  //       parameters: [],
  //       responses: {},
  //     },
  //   };
  //   obj.paths[key][method].tags = requests.body.paths[key].tags;

  //   for (const item in requests.body.paths[key].request.header) {
  //     const objectParamerter = {
  //       in: "header",
  //       name: Func.cutStarFormString(item),
  //       schema: {
  //         type: typeof item,
  //       },
  //       required: Func.checkRequest(item),
  //       description: Func.cutStarFormString(item),
  //     };
  //     obj.paths[key][method].parameters.push(objectParamerter);
  //   }

  //   for (const item in requests.body.paths[key].request.body) {
  //     let newItem;
  //     item.includes("*")
  //       ? (newItem = item.replace(/\*/g, ""))
  //       : (newItem = item);

  //     const value = requests.body.paths[key].request.body[item];
  //     // console.log("log nest : ", JSON.stringify(Func.nestObject(value)))

  //     if (Func.checkRequest(item))
  //       obj.paths[key][method].requestBody.content[
  //         "application/json"
  //       ].schema.required.push(newItem);

  //     obj.paths[key][method].requestBody.content[
  //       "application/json"
  //     ].schema.properties[newItem] = Func.nestObject(value);
  //     obj.paths[key][method].requestBody.content["application/json"].example[
  //       newItem
  //     ] = Func.cutStarFromObject(value);
  //   }
  //   if (
  //     obj.paths[key][method].requestBody.content["application/json"].schema
  //       .required.length == 0
  //   ) {
  //     delete obj.paths[key][method].requestBody.content["application/json"]
  //       .schema.required;
  //   }

  //   for (const item in requests.body.paths[key].response) {
  //     const responseData = {
  //       description: requests.body.paths[key].response[item].description,
  //       headers: {},

  //       content: {
  //         "application/json": {
  //           schema: {
  //             type: "object",
  //             properties: {},
  //             required: [],
  //           },
  //           example: {},
  //         },
  //       },
  //     };

  //     const res = requests.body.paths[key].response[item];

  //     for (const key in res.request.header) {
  //       const value = res.request.header[key];
  //       const objectHeader = {
  //         description: Func.cutStarFormString(key),
  //         required: Func.checkRequest(key),
  //         schema: {
  //           type: typeof value,
  //           example: value,
  //         },
  //       };
  //       responseData.headers[Func.cutStarFormString(key)] = objectHeader;
  //     }

  //     if (Object.keys(res.request.body).length != 0) {
  //       for (const key in res.request.body) {
  //         const value = res.request.body[key];

  //         if (Func.checkRequest(key)) {
  //           responseData.content["application/json"].schema.required.push(
  //             Func.cutStarFromObject(key)
  //           );
  //         }
  //         responseData.content["application/json"].example[
  //           Func.cutStarFormString(key)
  //         ] = Func.cutStarFromObject(value);
  //         responseData.content["application/json"].schema.properties[
  //           Func.cutStarFormString(key)
  //         ] = Func.nestObject(value);
  //       }
  //     } 
  //     if(responseData.content["application/json"].schema.required.length == 0)
  //       delete responseData.content["application/json"].schema.required


     
  //     try {
  //       obj.paths[key][method].responses[item] = responseData;
  //     } catch (error) {
  //       console.log("catch : ", error);
  //     }
  //   }
 
  // }

  // const yamlData = YAML.stringify(obj);
  // return { yamlData, fileName };


function CreateFileYAML(content, fileName) {
  try {
    if (!content) {
      console.error("No content provided to CreateFileYAML");
      return;
    }
    const afterV1 = fileName.split("/v1/")[1];

    fs.writeFileSync(`swaggers/files/${afterV1}.yaml`, content);

  } catch (err) {
    console.error("Error writing file:", err);
    throw err;
  }
}

function TransformSheetData(metaSheet, sheetData) {
  const [title, version] = metaSheet;
  const result = {
    title: title,
    version: version,
    tags : [],
    description: "",
    contact: "",
    servers: [],
    paths: {
    
    },
  };

  const state = {
    currentUri: null,
    currentMethod: null,
    currentHttpStatus: null,
    isRequest: false,
    isResponse: false,
  };
  const actions = new Map([
    [
      "tag",
      (key, element) => {
        result.tags.push( element.value)
      },
    ],
    [
      "description",
      (key, element) => {
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
        (result.contact = {
          name: element.value.split("@")[0],
          url: element.value.split("@")[1],
        }),
    ],
    [
      "servers",
      (key, element) => {
      
        const parts = element.value.split(/\r\n|\n/);
     
        const newArray = parts.map((item) => item.replace("@", ""));
        result.servers.push(...newArray);
     
      },
    ],
    [
      "uri",
      (key, element) => {
        result.paths[element.value] = {};
        state.currentUri = element.value;
      },
    ],
    [
      "method",
      (key, element) => {
        Object.assign(result.paths[state.currentUri], {
          method: element.value,
          tags : result.tags
        });
        delete result.tags
        state.currentMethod = element.value;
      },
    ],
    [
      "Request",
      (key, element) => {
        state.isRequest = true;
        state.isResponse = false;
      },
    ],
    [
      "Response",
      (key, element) => {
        state.isResponse = true;
        state.isRequest = false;
      },
    ],
    [
      "header",
      (key, element) => {
        const parsedValue = JSON.parse(element.value);

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
        const parsedValue = JSON.parse(element.value);
        const bodyDetail = {
          item: parsedValue,
        };
        if (state.isRequest) {
          result.paths[state.currentUri]["request"] = Object.assign(
            result.paths[state.currentUri]["request"] || {},
            {
              body: bodyDetail,
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
            body: bodyDetail,
          };
        }
      },
    ],
    [
      "http status",
      (key, element) => {
        state.currentHttpStatus = element.value;
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

module.exports = {
  ReadInit,
  CreateFileYAML,
  ReplaceData,
  TransformSheetData,
};
