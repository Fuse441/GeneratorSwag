const { FuncHelper } = require("./../Helper/FuncHelper");
export class OpenAPIBuilder {
  constructor(contentTemplate, element) {
    this.template = JSON.parse(JSON.stringify(contentTemplate));
    this.element = element;
    this.contentType = "";
  }

  buildInfo() {
    const { title, version, description, contact } = this.element;
    this.template.info = { title, version, description, contact };
  }

  buildServers() {
    this.template.servers = this.element.servers.map((url) => ({ url }));
  }

  buildPaths() {
    const newPaths = {};
    for (const path in this.element.paths) {
      const method = this.element.paths[path].method
        .toLowerCase()
        .replace(/['"]+/g, "");
      this.contentType =
        this.element.paths[path].request.header["*Content-Type"];
      const operation = this._initOperation(method, this.contentType);

      this._addParameters(operation, path);
      this._addRequestBody(operation, path, method);
      this._addResponses(operation, path, method);

      const cleanedPath = path.replace(/(\?.+)/g, "");
      newPaths[cleanedPath] = { [method]: operation };
    }
    this.template.paths = newPaths;
  }

  _initOperation(method, contentType) {
    return {
      tags: [],
      parameters: [],
      requestBody: {
        content: {
          [contentType]: {
            schema: {
              type: "object",
              properties: {},
              required: [],
            },
            example: {},
          },
        },
      },
      responses: {},
    };
  }

  _addParameters(operation, path) {
    const queryParam = Array.from(path.matchAll(/(\*?\w+)=([^&]+)/gm));
    const pathParam = Array.from(path.matchAll(/{(\w+)}/gm));
    const headers = this.element.paths[path].request.header;

    queryParam.forEach(([_, key, value]) => {
      operation.parameters.push(FuncHelper.buildQueryParam(key, value));
    });

    pathParam.forEach(([_, key]) => {
      operation.parameters.push(FuncHelper.buildPathParam(key));
    });

    for (const key in headers) {
      operation.parameters.push(FuncHelper.buildHeaderParam(key));
    }

    operation.tags = this.element.paths[path].tags;
  }

  _addRequestBody(operation, path, method) {
    const body = this.element.paths[path]?.request?.body || {};
    const headers = this.element.paths[path]?.request?.header || {};
    const contentType = this.contentType || "application/json";
  
    if (!operation.requestBody) {
      operation.requestBody = { content: { [contentType]: { schema: { type: "object", properties: {}, required: [] }, example: {} } } };
    }
  
    const { headers: headerObj, content } = this._buildContentObject(contentType, body, headers);
  
    operation.requestBody.content = content;
  
    if (method === "get") {
      delete operation.requestBody;
    }
  }
  
  

  _addResponses(operation, path, method) {
    const responses = this.element.paths[path]?.response || {};
  
    for (const code in responses) {
      const res = responses[code];
      const contentType = res.request?.header?.["*Content-Type"] || "application/json";
      const body = res.request?.body || {};
      const headers = res.request?.header || {};
  
      const { headers: headerObj, content } = this._buildContentObject(contentType, body, headers);
  
      operation.responses[`"${code}"`] = {
        description: res.description || '',
        headers: headerObj,
        content,
      };  
    }
  }
  
  _buildContentObject(contentType, body, headers) {
    const nested = FuncHelper.nestObject(body);
  
    const schema = {
      type: Array.isArray(body) ? "array" : "object",
      properties: !Array.isArray(body) ? nested.properties || {} : undefined,
      items: Array.isArray(body) ? nested.items || {} : undefined,
      required: nested.required || [],
    };
  
    if (schema.required.length === 0) {
      delete schema.required;
    }
  
    let example = Array.isArray(body) ? FuncHelper.cutStar(body) : {};
    if (!Array.isArray(body)) {
      for (const key in body) {
        const fieldName = FuncHelper.stripAsterisk(key);
        example[fieldName] = FuncHelper.cutStar(body[key]);
      }
    }
  
    const headerObj = {};
    for (const key in headers || {}) {
      const cleanKey = FuncHelper.stripAsterisk(key);
      headerObj[cleanKey] = {
        description: key.replace("*", ""),
        required: FuncHelper.isRequiredField(key),
        schema: {
          type: typeof headers[key],
          example: headers[key],
        },
      };
    }
  
    const content = {};
  
    if (contentType === "application/json") {
      content[contentType] = {
        schema,
        example,
      };
    }
  
    if (contentType === "application/xml") {
      const xmlSchema = {
        type: "object",
        properties: nested.properties,
        xml: {
          name: FuncHelper.cutStar(Object.keys(body)[0] || "root"),
        },
      };
      content[contentType] = {
        schema: xmlSchema,
      };
      // console.log("FuncHelper.cutStar(Object.keys(body)[0] ==> ", FuncHelper.cutStar(Object.keys(body)[0]));


    }
  
    return { headers: headerObj, content };
  }
  

  build() {
    this.buildInfo();
    this.buildServers();
    this.buildPaths();
    return this.template;
  }
}
