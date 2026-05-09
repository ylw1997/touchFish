const api = require("./api");

module.exports = {
  get platforms() {
    return api.platforms;
  },
  get endpoints() {
    return api.endpoints.map(({ handler: _handler, ...rest }) => rest);
  },
};
