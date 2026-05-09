// 系统平台端点
const { endpoint } = require("../utils");

// 平台定义
const platforms = [
  { id: "system", name: "系统", description: "服务状态、接口目录、本地配置。" },
  { id: "ithome", name: "IT之家", description: "新闻列表和详情。" },
  { id: "chiphell", name: "Chiphell", description: "论坛资讯列表和详情。" },
  { id: "v2ex", name: "V2EX", description: "节点列表和帖子详情。" },
  { id: "hupu", name: "虎扑", description: "步行街列表和详情。" },
  { id: "nga", name: "NGA", description: "论坛列表和帖子详情。" },
  { id: "linuxdo", name: "Linux.do", description: "帖子列表和详情。" },
  { id: "zhihu", name: "知乎", description: "推荐、热榜、问题、评论、搜索。" },
  { id: "weibo", name: "微博", description: "feed、评论、互动、搜索、热搜。" },
  { id: "bilibili", name: "B站", description: "视频、直播、动态、收藏、搜索。" },
  { id: "qqmusic", name: "QQ音乐", description: "搜索、歌曲、歌单、榜单、登录。" },
  { id: "xiaoyuzhou", name: "小宇宙", description: "发现、播客、单集、订阅。" },
  { id: "weread", name: "微信读书", description: "登录、书架、阅读、书籍、划线。" },
  { id: "xhs", name: "小红书", description: "feed、详情、评论、用户、互动、发布。" },
  { id: "x", name: "X", description: "时间线、搜索、用户、推文、互动。" },
];

// 系统端点
const systemEndpoints = [
  // 服务状态
  endpoint({
    id: "health",
    platformId: "system",
    name: "服务状态",
    path: "/health",
    description: "检查本地服务是否可用。",
    handler: async () => ({ ok: true, status: 200, data: { service: "touchfish-server", mode: "local" } }),
  }),

  // 配置列表
  endpoint({
    id: "config-list",
    platformId: "system",
    name: "配置列表",
    path: "/api/config",
    description: "查看脱敏后的本地配置。",
    handler: async (ctx) => ({ ok: true, status: 200, data: ctx.configStore.all() }),
  }),
];

// 列出所有端点（不含 handler）
function listEndpoints(allEndpoints) {
  return allEndpoints.map(({ handler: _handler, ...rest }) => rest);
}

module.exports = { platforms, systemEndpoints, listEndpoints };
