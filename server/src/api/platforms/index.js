// 平台端点集合
// 重构中：逐步从 apiRegistry.js 迁移到单独文件

// 新平台文件（已迁移）
const { zhihuEndpoints } = require("./zhihu");
const { weiboEndpoints } = require("./weibo");
const { bilibiliEndpoints } = require("./bilibili");
const { qqmusicEndpoints } = require("./qqmusic");
const { xiaoyuzhouEndpoints } = require("./xiaoyuzhou");
const { wereadEndpoints } = require("./weread");
const { xhsEndpoints } = require("./xhs");
const { xEndpoints } = require("./x");
const { newsEndpoints } = require("./news");
const { platforms, systemEndpoints, listEndpoints } = require("./system");
const { endpoint } = require("../utils");

// 合并所有端点（先合并，再添加 catalog）
const allEndpoints = [
  ...zhihuEndpoints,
  ...weiboEndpoints,
  ...bilibiliEndpoints,
  ...qqmusicEndpoints,
  ...xiaoyuzhouEndpoints,
  ...wereadEndpoints,
  ...xhsEndpoints,
  ...xEndpoints,
  ...newsEndpoints,
  ...systemEndpoints,
];

// Catalog 端点需要访问 platforms 和 listEndpoints
const catalogEndpoint = endpoint({
  id: "catalog",
  platformId: "system",
  name: "接口目录",
  path: "/api/catalog",
  description: "返回验证台平台和接口列表。",
  handler: async () => ({ ok: true, status: 200, data: { platforms, endpoints: listEndpoints(allEndpoints) } }),
});

// 最终端点列表
const endpoints = [...allEndpoints, catalogEndpoint];

// 按平台分组端点
function groupByPlatform(endpoints) {
  const groups = {};
  for (const endpoint of endpoints) {
    if (!groups[endpoint.platformId]) {
      groups[endpoint.platformId] = [];
    }
    groups[endpoint.platformId].push(endpoint);
  }
  return groups;
}

// 获取特定平台的端点
function getPlatformEndpoints(platformId) {
  return endpoints.filter(e => e.platformId === platformId);
}

module.exports = {
  platforms,
  endpoints,
  groupByPlatform,
  getPlatformEndpoints,
};
