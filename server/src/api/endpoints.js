// 端点注册和执行
// 从 platforms/index.js 导入所有端点

const platforms = require("./platforms");

// 获取端点列表
function getEndpoints() {
  return platforms.endpoints;
}

// 列出所有端点（不包含 handler）
function listEndpoints() {
  return getEndpoints().map(({ handler: _handler, ...rest }) => rest);
}

// 执行指定端点
async function executeApiEndpoint({ method, pathname, url, headers, fetchImpl, configStore, body }) {
  const endpoints = getEndpoints();
  const item = endpoints.find((candidate) => candidate.method === method && candidate.path === pathname);
  if (!item?.handler) return null;
  return item.handler({ url, headers, fetchImpl, configStore, body });
}

module.exports = {
  getEndpoints,
  listEndpoints,
  executeApiEndpoint,
};
