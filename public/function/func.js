
module.exports.checkRequest = function (key) {
    if (typeof key == "string" && key.includes('*')) {
        return true
    } else {
        return false
    }
};

module.exports.cutStarFormString = function (key) {
    if (key.includes('*', 0))
        return key.replace(/\*/g, "")
    else return key
}

module.exports.cutStarFormObject = function (object) {
    if (Array.isArray(object)) {
       for (const element of object) {
        return element
        // if (element.includes('*', 0)) {
        //     object = this.nestObject(object);
            
        //     return key.replace(/\*/g, "")
        // }

       }
    } 
       else{

       }
    }

    // } else if (typeof object === "object" && object !== null) {
    //     structured = {
    //         type: "object",
    //         properties: {},
    //     };
    //     for (const key in object) {
    //         structured.properties[this.cutStarFormString(key)] = this.nestObject(object[key]);
    //     }
    //     return structured;

    // } else {
    //     return { 
    //         type: typeof object 
    //     };
    // }



module.exports.nestObject = function (object, structured = {}) {
    if (Array.isArray(object)) {
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
        };
        for (const key in object) {
            structured.properties[this.cutStarFormString(key)] = this.nestObject(object[key]);
        }
        return structured;

    } else {
        return { 
            type: typeof object 
        };
    }
};


