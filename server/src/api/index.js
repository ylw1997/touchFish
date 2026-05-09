// API 模块入口
// 重构后的 API 目录结构

const platforms = require("./platforms");
const { getEndpoints, listEndpoints, executeApiEndpoint } = require("./endpoints");

// 注意：使用 getter 避免循环依赖问题
module.exports = {
  get platforms() {
    return platforms.platforms;
  },
  get endpoints() {
    return getEndpoints();
  },
  listEndpoints,
  executeApiEndpoint,
};
