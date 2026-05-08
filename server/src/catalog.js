const { platforms, listEndpoints } = require("./apiRegistry");

module.exports = {
  platforms,
  endpoints: listEndpoints(),
};
