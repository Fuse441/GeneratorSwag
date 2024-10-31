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
}
function ReplaceData(content, requests) {
    const obj = JSON.parse(JSON.stringify(content));
    obj.info.title = requests.body.title
    obj.info.version = requests.body.version
    obj.info.description = requests.body.description
    obj.info.contact = requests.body.contact

    const addUrl = requests.body.servers.map(item => {
        return { url: item };
    });
    obj.servers = Object.assign(addUrl, obj.servers)
    obj.paths = requests.body.paths
    for (const key in obj.paths) {
        obj.paths[key].method = requests.body.paths[key].method.replace(/['"]+/g, '');
        console.log(obj.paths[key].method)     
    }
   
    const headers = requests.headers


    // for (const item in headers) {
    //     console.log("item in header : " + item)
    //     console.log("value : " + headers[item])
    // }
    const body = requests.body

    //set header


    // console.log(requests.body.paths['api/v1/communicationMessage'])
    const yamlData = YAML.stringify(obj);
    return yamlData

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
