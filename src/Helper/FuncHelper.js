export const FuncHelper = {
    stripAsterisk: (str) => str.replace(/\*/g, ""),
    isRequiredField: (str) => str.includes("*"),
  
    cutStar: (data) => {
      if (Array.isArray(data)) {
        return data.map((element) => FuncHelper.cutStar(element));
      } else if (typeof data === "string") {
        return data.replace(/\*/g, "");
      } else if (data && typeof data === "object") {
        const cleanedObject = {};
        for (const key in data) {
          const cleanKey = FuncHelper.stripAsterisk(key);
          cleanedObject[cleanKey] = FuncHelper.cutStar(data[key]);
        }
        return cleanedObject;
      }
      return data;
    },
  
    nestObject: (object, structured = {}) => {
      if (Array.isArray(object)) {
        structured = {
          type: "array",
          items: {},
        };
        if (object.length > 0) {
          structured.items = FuncHelper.nestObject(object[0]);
        }
        return structured;
      } else if (typeof object === "object" && object !== null) {
        structured = {
          type: "object",
          properties: {},
          required: [],
        };
  
        for (const key in object) {
          const cleanKey = FuncHelper.stripAsterisk(key);
          if (key.startsWith("*")) {
            structured.required.push(cleanKey);
          }
          structured.properties[cleanKey] = FuncHelper.nestObject(object[key]);
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
    },
  
    buildQueryParam: (key, value) => ({
      in: "query",
      name: FuncHelper.stripAsterisk(key),
      schema: { type: typeof value },
      required: FuncHelper.isRequiredField(key),
      description: value,
    }),
  
    buildPathParam: (key) => ({
      in: "path",
      name: key,
      schema: { type: "string" },
      required: true,
      description: key,
    }),
   
    buildHeaderParam: (key) => ({
      in: "header",
      name: FuncHelper.stripAsterisk(key),
      schema: { type: "string" },
      required: FuncHelper.isRequiredField(key),
      description: key,
    }),
  
    buildResponse: (res) => {
      const schema = {
        type: "object",
        properties: {},
        required: [],
      };
  
      const example = {};
  
      for (const key in res.request.body || {}) {
        const cleanKey = FuncHelper.stripAsterisk(key);
        schema.properties[cleanKey] = FuncHelper.nestObject(res.request.body[key]);
        example[cleanKey] = FuncHelper.cutStar(res.request.body[key]);
        if (FuncHelper.isRequiredField(key)) schema.required.push(cleanKey);
      }
  
      if (schema.required.length === 0) delete schema.required;
  
      const headers = {};
      for (const key in res.request.header) {
        headers[FuncHelper.stripAsterisk(key)] = {
          description: key.replace("*", ""),
          required: FuncHelper.isRequiredField(key),
          schema: {
            type: typeof res.request.header[key],
            example: res.request.header[key],
          },
        };
      }
  
      return {
        description: res.description,
        headers,
        content: {
          "application/json": {
            schema,
            example,
          },
        },
      };
    },
  };
  