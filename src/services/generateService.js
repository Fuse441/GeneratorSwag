const OpenAPIBuilder = require('../builders/openAPIBuilder');

exports.init = async () => {
  const builder = new OpenAPIBuilder();
  const getSpec = await builder.getSpec();
  return getSpec;
};


