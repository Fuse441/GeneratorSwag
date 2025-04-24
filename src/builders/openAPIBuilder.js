class OpenAPIBuilder {
  constructor() {
    console.log("✅ OpenAPIBuilder initialized");
  }

  async getSpec() {
    return {
      openapi: "3.0.0",
      info: {
        title: "title name",
        version: "version api",
        description: "description",
        contact: {
          name: "name contact",
          url: "url T3"
        }
      },
      servers: [{ url: "http://localhost:8801" }],
      paths: {}
    };
  }
}

module.exports = OpenAPIBuilder;
