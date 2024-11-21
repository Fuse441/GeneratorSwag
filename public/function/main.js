const { application, response } = require('express');
const fs = require('fs');
const YAML = require('json-to-pretty-yaml');
const appError = require('../../swaggers/structured/appError.json');
const { type } = require('os');
const e = require('express');
const Func = require('../function/func');

function ReadInit() {
    return new Promise((resolve, reject) => {
        fs.readFile('swaggers/structured/openapi.json', 'utf8', (err, data) => {
            if (err) {
                console.error("Error reading file:", err);
                return reject(err);
            }
            try {
               
                const jsonData = JSON.parse(data);
                // console.log("#42b983")
                //  const result = YAML.stringify(jsonData);
                resolve(jsonData);
            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                reject(parseError);
            }
        });
    });
} function ReplaceData(content, requests) {
    const obj = JSON.parse(JSON.stringify(content));
    let fileName = ""
    obj.info.title = requests.body.title;
    obj.info.version = requests.body.version;
    obj.info.description = requests.body.description;
    obj.info.contact = requests.body.contact;


    obj.servers = requests.body.servers.map(item => ({ url: item }));


    obj.paths = {};
    for (const key in requests.body.paths) {
        fileName = key
        const method = requests.body.paths[key].method.toLowerCase().replace(/['"]+/g, '');
        obj.paths[key] = {
            [method]: {
                tags: [],
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {},
                                required: []
                            },
                            example: {}
                        }
                    }
                },
                parameters: [],
                responses: {}

            }
        };
        obj.paths[key][method].tags = (requests.body.paths[key].tags)
    
        for (const item in requests.body.paths[key].request.header) {
            
            const objectParamerter = {
                in: "header",
                name: Func.cutStarFormString(item),
                schema: {
                    type: typeof item
                },
                required: Func.checkRequest(item),
                description: Func.cutStarFormString(item)
            }
            obj.paths[key][method].parameters.push(objectParamerter)
        }



        for (const item in requests.body.paths[key].request.body) {
            let newItem;
            item.includes('*') ? newItem = item.replace(/\*/g,"") : newItem = item
            
            const value = requests.body.paths[key].request.body[item];            
            console.log("log nest : ",JSON.stringify(Func.nestObject(value)))

            if(Func.checkRequest(item))
                obj.paths[key][method].requestBody.content['application/json'].schema.required.push(newItem)
            
                obj.paths[key][method].requestBody.content['application/json'].schema.properties[newItem] = Func.nestObject(value);
                obj.paths[key][method].requestBody.content['application/json'].example[newItem] = Func.cutStarFromObject(value)
      
            
        };
        if (obj.paths[key][method].requestBody.content['application/json'].schema.required.length == 0){
            delete obj.paths[key][method].requestBody.content['application/json'].schema.required
        }
      
        for (const item in requests.body.paths[key].response) {
            console.log("log for : ",item)
            const responseData = {

                description: requests.body.paths[key].response[item].description,
                headers: {

                },

                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {

                            },
                            required: []
                        },
                        example: {}
                    }
                }
            };



            const res = requests.body.paths[key].response[item]
          
                for (const key in res.request.header) {
                    console.log("key : " , key)
                    const value = res.request.header[key];
                    const objectHeader = {
                        description: Func.cutStarFormString(key),
                        required: Func.checkRequest(key),
                        schema: {
                            type: typeof value,
                            example: value
                        }

                    }
                    responseData.headers[Func.cutStarFormString(key)] = objectHeader
                }
            
            if (Object.keys(res.request.body).length != 0) {
                for (const key in res.request.body) {
                    const value = res.request.body[key];

                    console.log("log object --> ",Func.cutStarFromObject(value))
                 

                if(Func.checkRequest(key)){
                    responseData.content['application/json'].schema.required.push(Func.cutStarFromObject(key))
                }
                responseData.content['application/json'].example[Func.cutStarFormString(key)] = Func.cutStarFromObject(value);
                responseData.content['application/json'].schema.properties[Func.cutStarFormString(key)] = Func.nestObject(value);
                
                }
            } else {
                delete responseData.content['application/json'].schema.required
            }

            try {
                obj.paths[key][method].responses[item] = responseData;
            } catch (error) {
                console.log("catch : ", error);
            }

            // }

            // for (const key in res.nonRquire.header) {
            //     const value = res.nonRquire.header[key];
            //     const objectHeader = {
            //         description: key,
            //         required: true,
            //         schema: {
            //             type: typeof value,

            //         }

            //     }
            //     responseData.headers[key] = objectHeader
            // }

            // for (const key in res.nonRquire.body) {
            //     const value = res.nonRquire.body[key];

            //     let objectBody;

            //     if (Array.isArray(value)) {

            //         objectBody = {
            //             example: value.map(item => checkAndAct(item))
            //         };
            //     } else if (typeof value === "object" && value !== null) {
            //         objectBody = {
            //             type: typeof checkAndAct(value)
            //         };
            //     } else if (typeof value === "string") {
            //         objectBody = {
            //             type: typeof checkAndAct(value)
            //         };
            //     } else {
            //         objectBody = {
            //             type: typeof value
            //         };
            //     }
            //     // //console.log("object Body : ",objectBody)

            //     responseData.content['application/json'].example[key] = value;
            //     responseData.content['application/json'].schema.properties[key] = objectBody;
            // }

            try {
                obj.paths[key][method].responses[item] = responseData;
            } catch (error) {
                console.log("catch : ", error);
            }


        }
        const objectAppError = {
            description: "",
            headers: {
                "content-type": {
                    description: "content-type",
                    required: true,
                    schema: {
                        type: "string",
                        example: ""

                    }
                }
            },
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        properties: {}
                    },
                    examples: {

                    }

                }

            }

        }
        
    }


    const yamlData = YAML.stringify(obj);
    return { yamlData, fileName };

}

function checkAndAct(text) {
    // //console.log(typeof text);
    if (typeof text === 'object' && text !== null) {
        const object = {};
        for (const key in text) {
            if (key.includes('@')) {
                // //console.log("log for : " + key)
                object[key] = `${text[key]}`;
                delete object[key]
                const keyTemp = `'${key}'`
                const objTemp = {
                    [keyTemp]: text[key]
                }
                Object.assign(object, objTemp)
                // delete object[key]
                // object = {
                //     "asd" : "test"
                // }

            } else {
                object[key] = text[key];
            }
        }
        // //console.log("log object: " + JSON.stringify(object));
        return object;
    }
    return text;
}




function CreateFileYAML(content, fileName) {
    // //console.log("Content to write:", content); 
    try {
        if (!content) {
            console.error("No content provided to CreateFileYAML");
            return;
        }
        // const path = "/api/v1/communicationMessage";
        const afterV1 = fileName.split('/v1/')[1];

        fs.writeFileSync(`swaggers/files/${afterV1}.yaml`, content);
        // //console.log("YAML file created successfully");
    } catch (err) {
        console.error("Error writing file:", err);
        throw err;
    }
}

module.exports = {
    ReadInit,
    CreateFileYAML,
    ReplaceData
};
