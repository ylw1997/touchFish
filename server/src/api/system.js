const { endpoint } = require("./utils");

const systemEndpoints = [
  endpoint({
    id: "system-health",
    platformId: "system",
    name: "健康检查",
    path: "/api/system/health",
    handler: () => ({ ok: true, status: 200, data: { message: "ok" } }),
  }),
  endpoint({
    id: "system-config",
    platformId: "system",
    name: "配置列表",
    path: "/api/system/config",
    handler: ({ configStore }) => ({ ok: true, status: 200, data: configStore.all() }),
  }),
];

module.exports = { systemEndpoints };
