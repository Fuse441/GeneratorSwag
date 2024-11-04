const { application, response } = require('express');
const fs = require('fs');
const YAML = require('json-to-pretty-yaml');

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


    obj.info.title = requests.body.title;
    obj.info.version = requests.body.version;
    obj.info.description = requests.body.description;
    obj.info.contact = requests.body.contact;


    obj.servers = requests.body.servers.map(item => ({ url: item }));


    obj.paths = {};
    for (const key in requests.body.paths) {
        const method = requests.body.paths[key].method.toLowerCase().replace(/['"]+/g, '');
        obj.paths[key] = {
            [method]: {
                parameters: [],
                responses: {}

            }
        };
        // delete obj.paths[key].method;
        // console.log(typeof requests.headers)

        for (const item in requests.headers) {
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


        for (const item in requests.body.paths[key].body) {
            const responseData = {
                
                    description: "test",
                    content: {
                        "application/json": {
                            schema: {
                                type: "string",
                                example: "stom"
                            }
                        }
                    }
                

            };

            try {
               
                obj.paths[key][method].responses[item] = responseData;
            } catch (error) {
                console.log("catch : ",error)
            }
            
        }
    };



    const yamlData = YAML.stringify(obj);
    return yamlData;


}






function CreateFileYAML(content) {
    // console.log("Content to write:", content); 
    try {
        if (!content) {
            console.error("No content provided to CreateFileYAML");
            return;
        }
        fs.writeFileSync('swaggers/test1.yaml', content);
        console.log("YAML file created successfully");
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
