const { application, response } = require('express');
const fs = require('fs');
const YAML = require('json-to-pretty-yaml');
const appError = require('../../swaggers/structured/appError.json');
const { type } = require('os');
const e = require('express');
function ReadInit() {
    return new Promise((resolve, reject) => {
        fs.readFile('swaggers/structured/openapi.json', 'utf8', (err, data) => {
            if (err) {
                console.error("Error reading file:", err);
                return reject(err);
            }
            try {
                const jsonData = JSON.parse(data);
                // const result = YAML.stringify(jsonData);
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
        // console.log("log path : " + JSON.stringify(requests.body.paths[key]))
        const method = requests.body.paths[key].method.toLowerCase().replace(/['"]+/g, '');
        obj.paths[key] = {
            [method]: {
                requestBody: {
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {},
                                required: []
                            },
                            example : {}
                        }
                    }
                },
                parameters: [],
                responses: {}

            }
        };

        for (const item in requests.body.paths[key].require.header) {
            const objectParamerter = {
                in: "header",
                name: item,
                schema: {
                    type: typeof item
                },
                required: true,
                description: item
            }
            obj.paths[key][method].parameters.push(objectParamerter)
        }

        // loop require Body ************************************
        requests.body.paths[key].require.body.forEach((element, index,array) => {
             console.log("log require : " + JSON.stringify(index));
            obj.paths[key][method].requestBody.content['application/json'].schema.required.push(element.key)

                switch (element.type) {
                    case "array":
                        const objectArrayRequire = {
                            type: element.type,
                            items: {
                                type: "object",
                                properties : {},
                                required: []
                            },
                        };
                        setArrayObjectRequire(objectArrayRequire, element);
                        break;

                    case "string":

                        const objectStringRequire = {
                            type: element.type,
                        };
                        setStringObjectRequire(objectStringRequire, element);
                        break;
                    case "object":

                        const objectRequire = {
                            type: element.type,
                            properties : {}
                        };
                        setObjectRequire(objectRequire, element);
                        break;
                    default:
                        break;
                }

                if (index === array.length - 1) {
                    
                   
                }
            
        });

        function setArrayObjectRequire(objectArrayRequire, element) {
           
            
            objectArrayRequire.items.required = [...element.requireKey];

            for (const key in element.example[0]) {
              
                objectArrayRequire.items.properties[key] = { type: "string" };
            }

           
            
      
            objectArrayRequire.example = element.example.map(exampleItem => ({
                ...exampleItem
            }));

            const withOutExample = {
                type : objectArrayRequire.type,
                items : objectArrayRequire.items
                
            }
            obj.paths[key][method].requestBody.content['application/json'].schema.properties[element.key] = withOutExample
            
            obj.paths[key][method].requestBody.content['application/json'].example[element.key] = objectArrayRequire.example
        
        }
        
        function setStringObjectRequire(objectStringRequire, element) {
            obj.paths[key][method].requestBody.content['application/json'].schema.properties[element.key] = objectStringRequire;
            obj.paths[key][method].requestBody.content['application/json'].example[element.key] = element.example

        }
        function setObjectRequire(objectRequire, element) {
             
            objectRequire.required = [...element.requireKey];
            for (const key in element.example) {
                console.log(key)
                objectRequire.properties[key] = { type: typeof element.example[key] };
            }
            obj.paths[key][method].requestBody.content['application/json'].schema.properties[element.key] = objectRequire;
            obj.paths[key][method].requestBody.content['application/json'].example[element.key] = element.example

        }


        // for (const item of requests.body.paths[key].require.body) {
        //     const objectResponseBody = {

        //         type: typeof item,
        //         example: requests.body.paths[key].require.body[item]

        //     }

        //     obj.paths[key][method].requestBody.content['application/json'].schema.required.push(item)

        //     obj.paths[key][method].requestBody.content['application/json'].schema.properties[item] = objectResponseBody

        // }

        // delete  obj.paths[key][method].requestBody.content['application/json'].schema.required

        for (const item in requests.body.paths[key].request.header) {
            const objectParamerter = {
                in: "header",
                name: item,
                schema: {
                    type: typeof item
                },
                required: false,
                description: item
            }
            obj.paths[key][method].parameters.push(objectParamerter)
        }


            for (const item in requests.body.paths[key].request.body) {
                const value = requests.body.paths[key].request.body[item];
                console.log("log item : ",item)
                let objectResponseBody = {};

                if (Array.isArray(value)) {
                    objectResponseBody = {
                        type: "array",
                        example: []
                    };

                    for (const element of value) {
                        let formattedElement = {};

                        for (const key in element) {
                            const formattedKey = key.includes("@") ? `'${key}'` : key;
                            formattedElement[formattedKey] = element[key];
                        }

                         objectResponseBody.example.push(formattedElement);
                    }
                    obj.paths[key][method].requestBody.content['application/json'].example[item] = objectResponseBody.example;

                }
                else if (typeof value === "object" && value !== null) {
                    
                

                    objectResponseBody = {
                        type: "object",
                        properties: {}
                    };

                    for (const subKey in value) {
                       
                        const formattedSubKey = subKey.includes("@") ? `'${subKey}'` : subKey;
                        console.log("format key : ",formattedSubKey )
                        objectResponseBody.properties[item] = {
                            type: typeof value[subKey],
                            
                        };
                      
                    }
                    obj.paths[key][method].requestBody.content['application/json'].example[item] = value;
                    console.log("log value",obj.paths[key][method].requestBody.content['application/json'].example)

                }
                else {
                    objectResponseBody = {
                        type: typeof value,
                        example: value
                    };
                    obj.paths[key][method].requestBody.content['application/json'].example[item] = value;
                }
                const withOutExample = {
                    type: typeof value
                }
              
                obj.paths[key][method].requestBody.content['application/json'].schema.properties[item] = withOutExample;
                // obj.paths[key][method].requestBody.content['application/json'].example[item] = objectResponseBody.example;
                // console.log("log value 2",obj.paths[key][method].requestBody.content['application/json'].example)

            // }





            // console.log("log res : " +  JSON.stringify(Object.keys(requests.body.paths[key].response).length))

        

        };
        for (const item in requests.body.paths[key].response) {
            console.log("in case response")
                
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
                            }
                        }
                    }
                };
    
    
    
                const res = requests.body.paths[key].response[item]
                if (Object.keys(res.require.header).length != 0) {
                    for (const key in res.require.header) {
    
                        const value = res.require.header[key];
                        const objectHeader = {
                            description: key,
                            required: true,
                            schema: {
                                type: typeof value,
                                example: value
                            }
    
                        }
                        responseData.headers[key] = objectHeader
                    }
                }
                else {
                    // responseData.content['application/json'].schema.header[`'${key.toString()}'`] = objectBody
                }
                if(Object.keys(res.require.body).length != 0){
                for (const key in res.require.body) {
                    const value = res.require.body[key];
    
                    const objectBody = {
                        example: value
                    };
    
                    responseData.content['application/json'].schema.required.push(key)
                    responseData.content['application/json'].schema.properties[`'${key.toString()}'`] = objectBody
                }
            }else{
               delete responseData.content['application/json'].schema.required  
          
            }
    
                for (const key in res.nonRquire.header) {
                    const value = res.nonRquire.header[key];
                    const objectHeader = {
                        description: key,
                        required: true,
                        schema: {
                            type: typeof value,
                            example: value
                        }
    
                    }
                    responseData.headers[key] = objectHeader
                }
    
                for (const key in res.nonRquire.body) {
                    const value = res.nonRquire.body[key];
                    // console.log("check value : " + JSON.stringify(value) + " = " + JSON.stringify(typeof value));
    
                    let objectBody;
    
                    if (Array.isArray(value)) {
    
                        objectBody = {
                            example: value.map(item => checkAndAct(item))
                        };
                    } else if (typeof value === "object" && value !== null) {
                        objectBody = {
                            example: checkAndAct(value)
                        };
                    } else if (typeof value === "string") {
                        objectBody = {
                            example: checkAndAct(value)
                        };
                    } else {
                        objectBody = {
                            example: value
                        };
                    }
    
                    responseData.content['application/json'].schema.properties[key] = objectBody;
                }
    
                try {
                    obj.paths[key][method].responses[item] = responseData;
                } catch (error) {
                    console.log("catch : ", error);
                }
    
    
            }


        const yamlData = YAML.stringify(obj);
        return { yamlData, fileName };

    }

    function checkAndAct(text) {
        // console.log(typeof text);
        if (typeof text === 'object' && text !== null) {
            const object = {};
            for (const key in text) {
                if (key.includes('@')) {
                    // console.log("log for : " + key)
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
            // console.log("log object: " + JSON.stringify(object));
            return object;
        }
        return text;
    }
}



function CreateFileYAML(content, fileName) {
    // console.log("Content to write:", content); 
    try {
        if (!content) {
            console.error("No content provided to CreateFileYAML");
            return;
        }
        // const path = "/api/v1/communicationMessage";
        const afterV1 = fileName.split('/v1/')[1];

        fs.writeFileSync(`swaggers/files/${afterV1}.yaml`, content);
        // console.log("YAML file created successfully");
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
