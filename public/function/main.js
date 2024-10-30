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
                const result = YAML.stringify(jsonData);
                resolve(result);
            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                reject(parseError);
            }
        });
    });
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
    CreateFileYAML
};
