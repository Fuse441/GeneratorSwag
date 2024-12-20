const { application, response } = require('express');
const fs = require('fs');
const YAML = require('json-to-pretty-yaml');
const appError = require('../../swaggers/structured/appError.json');
const { type } = require('os');
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
                            }
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
                description: "test"
            }
            obj.paths[key][method].parameters.push(objectParamerter)
        }
        // console.log("log check " + Object.keys(requests.body.paths[key].require.body).length)
        if(Object.keys(requests.body.paths[key].require.body).length != 0){
        for (const item in requests.body.paths[key].require.body) {
            const objectResponseBody = {

                type: typeof item,
                example: requests.body.paths[key].require.body[item]

            }

            obj.paths[key][method].requestBody.content['application/json'].schema.required.push(item)

            obj.paths[key][method].requestBody.content['application/json'].schema.properties[item] = objectResponseBody

        }
    }else{
        delete  obj.paths[key][method].requestBody.content['application/json'].schema.required
    }
        for (const item in requests.body.paths[key].request.header) {
            const objectParamerter = {
                in: "header",
                name: item,
                schema: {
                    type: typeof item
                },
                required: false,
                description: "test"
            }
            obj.paths[key][method].parameters.push(objectParamerter)
        }


        for (const item in requests.body.paths[key].request.body) {
            const value = requests.body.paths[key].request.body[item];
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
            }
            else if (typeof value === "object" && value !== null) {
                objectResponseBody = {
                    type: "object",
                    properties: {}
                };

                for (const subKey in value) {
                    const formattedSubKey = subKey.includes("@") ? `'${subKey}'` : subKey;

                    objectResponseBody.properties[formattedSubKey] = {
                        type: typeof value[subKey],
                        example: value[subKey]
                    };
                }
            }
            else {
                objectResponseBody = {
                    type: typeof value,
                    example: value
                };
            }

            obj.paths[key][method].requestBody.content['application/json'].schema.properties[item] = objectResponseBody;
        }





        // console.log("log res : " +  JSON.stringify(Object.keys(requests.body.paths[key].response).length))
      
            for (const item in requests.body.paths[key].response) {

                // console.log("item : check" + item)
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
            //    console.log("check log : " + Object.keys(res.require.body).length) 
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
        


    };



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




function CreateFileYAML(content, fileName) {
    // console.log("Content to write:", content); 
    try {
        if (!content) {
            console.error("No content provided to CreateFileYAML");
            return;
        }
        // const path = "/api/v1/communicationMessage";
        const afterV1 = fileName.split('/v1/')[1];

        fs.writeFileSync(`swaggers/${afterV1}.yaml`, content);
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
