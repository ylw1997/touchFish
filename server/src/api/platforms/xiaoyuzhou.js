// 小宇宙平台端点
const { fetchJson, readUpstreamJson } = require("../../upstream");
const { endpoint, p, getQuery, requireQuery, cookie } = require("../utils");
const { buildXiaoyuzhouHeaders, extractXiaoyuzhouAuth, getDeviceId, nowIsoWithTimezone } = require("../../xiaoyuzhouCore");

// 小宇宙请求辅助函数
async function xiaoyuzhouRequest(ctx, target, { method = "GET", body, contentType } = {}) {
  let accessToken = cookie(ctx.configStore, "xiaoyuzhouAccessToken");
  let refreshToken = cookie(ctx.configStore, "xiaoyuzhouRefreshToken");
  const deviceId = cookie(ctx.configStore, "xiaoyuzhouDeviceId") || getDeviceId(refreshToken || accessToken);
  const doRequest = () =>
    fetchJson(ctx.fetchImpl, target, {
      method,
      headers: buildXiaoyuzhouHeaders({
        accessToken,
        refreshToken,
        contentType,
        localTime: nowIsoWithTimezone(),
        deviceId,
      }),
      body: body ? JSON.stringify(body) : undefined,
    });

  let result = await doRequest();
  if (result.status !== 401 || !refreshToken) return result;

  const refreshResponse = await ctx.fetchImpl("https://api.xiaoyuzhoufm.com/app_auth_tokens.refresh", {
    method: "POST",
    headers: buildXiaoyuzhouHeaders({
      accessToken,
      refreshToken,
      contentType: "application/x-www-form-urlencoded; charset=utf-8",
      localTime: nowIsoWithTimezone(),
      deviceId,
    }),
  });
  const auth = extractXiaoyuzhouAuth(Object.fromEntries(refreshResponse.headers.entries()));
  if (!auth.accessToken || !auth.refreshToken) return result;

  accessToken = auth.accessToken;
  refreshToken = auth.refreshToken;
  ctx.configStore.set("xiaoyuzhouAccessToken", accessToken);
  ctx.configStore.set("xiaoyuzhouRefreshToken", refreshToken);
  result = await doRequest();
  result.refreshedToken = true;
  return result;
}

const xiaoyuzhouEndpoints = [
  // 刷新 token
  endpoint({
    id: "xiaoyuzhou-refresh-token",
    platformId: "xiaoyuzhou",
    name: "刷新 token",
    method: "POST",
    path: "/api/xiaoyuzhou/refresh-token",
    handler: async (ctx) => {
      const accessToken = cookie(ctx.configStore, "xiaoyuzhouAccessToken");
      const refreshToken = cookie(ctx.configStore, "xiaoyuzhouRefreshToken");
      const response = await ctx.fetchImpl("https://api.xiaoyuzhoufm.com/app_auth_tokens.refresh", {
        method: "POST",
        headers: buildXiaoyuzhouHeaders({
          accessToken,
          refreshToken,
          contentType: "application/x-www-form-urlencoded; charset=utf-8",
          localTime: nowIsoWithTimezone(),
          deviceId: cookie(ctx.configStore, "xiaoyuzhouDeviceId") || getDeviceId(refreshToken),
        }),
      });
      const auth = extractXiaoyuzhouAuth(Object.fromEntries(response.headers.entries()));
      if (auth.accessToken) ctx.configStore.set("xiaoyuzhouAccessToken", auth.accessToken);
      if (auth.refreshToken) ctx.configStore.set("xiaoyuzhouRefreshToken", auth.refreshToken);
      return { ok: response.ok, status: response.status, data: { refreshed: !!auth.accessToken, auth: { accessToken: !!auth.accessToken, refreshToken: !!auth.refreshToken } } };
    },
  }),

  // 发现流
  endpoint({
    id: "xiaoyuzhou-discovery-feed",
    platformId: "xiaoyuzhou",
    name: "discovery-feed",
    path: "/api/xiaoyuzhou/discovery-feed",
    handler: (ctx) =>
      xiaoyuzhouRequest(ctx, "https://api.xiaoyuzhoufm.com/v1/discovery-feed/list", {
        method: "POST",
        contentType: "application/json",
        body: { returnAll: "false" },
      }),
  }),

  // 收件箱
  endpoint({
    id: "xiaoyuzhou-inbox",
    platformId: "xiaoyuzhou",
    name: "inbox",
    path: "/api/xiaoyuzhou/inbox",
    handler: (ctx) =>
      xiaoyuzhouRequest(ctx, "https://api.xiaoyuzhoufm.com/v1/inbox/list", {
        method: "POST",
        contentType: "application/json",
        body: { limit: "20" },
      }),
  }),

  // 编辑精选
  endpoint({
    id: "xiaoyuzhou-pilot-discovery",
    platformId: "xiaoyuzhou",
    name: "pilot-discovery",
    path: "/api/xiaoyuzhou/pilot-discovery",
    handler: (ctx) =>
      xiaoyuzhouRequest(ctx, "https://api.xiaoyuzhoufm.com/v1/pilot-discovery/list", {
        method: "POST",
        contentType: "application/json",
        body: {},
      }),
  }),

  // 榜单
  endpoint({
    id: "xiaoyuzhou-top-list",
    platformId: "xiaoyuzhou",
    name: "榜单",
    path: "/api/xiaoyuzhou/top-list",
    handler: (ctx) =>
      xiaoyuzhouRequest(ctx, "https://api.xiaoyuzhoufm.com/v1/top-list/get?category=HOT_EPISODES_IN_24_HOURS", {
        method: "GET",
      }),
  }),

  // 搜索播客
  endpoint({
    id: "xiaoyuzhou-search",
    platformId: "xiaoyuzhou",
    name: "搜索播客",
    path: "/api/xiaoyuzhou/search",
    params: [p("keyword", true, "科技")],
    handler: (ctx) =>
      xiaoyuzhouRequest(ctx, "https://api.xiaoyuzhoufm.com/v1/search/create", {
        method: "POST",
        contentType: "application/json",
        body: { keyword: requireQuery(ctx.url, "keyword"), type: "PODCAST" },
      }),
  }),

  // 播客详情
  endpoint({
    id: "xiaoyuzhou-podcast-detail",
    platformId: "xiaoyuzhou",
    name: "播客详情",
    path: "/api/xiaoyuzhou/podcast-detail",
    params: [p("pid", true, "")],
    handler: (ctx) =>
      xiaoyuzhouRequest(ctx, `https://api.xiaoyuzhoufm.com/v1/podcast/get?pid=${requireQuery(ctx.url, "pid")}`, {
        method: "GET",
      }),
  }),

  // 单集列表
  endpoint({
    id: "xiaoyuzhou-episode-list",
    platformId: "xiaoyuzhou",
    name: "单集列表",
    path: "/api/xiaoyuzhou/episode-list",
    params: [p("pid", true, ""), p("order", false, "desc")],
    handler: (ctx) =>
      xiaoyuzhouRequest(ctx, "https://api.xiaoyuzhoufm.com/v1/episode/list", {
        method: "POST",
        contentType: "application/json",
        body: { pid: requireQuery(ctx.url, "pid"), order: getQuery(ctx.url, "order", "desc") },
      }),
  }),

  // 单集详情
  endpoint({
    id: "xiaoyuzhou-episode-detail",
    platformId: "xiaoyuzhou",
    name: "单集详情",
    path: "/api/xiaoyuzhou/episode-detail",
    params: [p("eid", true, "")],
    handler: (ctx) =>
      xiaoyuzhouRequest(ctx, `https://api.xiaoyuzhoufm.com/v1/episode/get?eid=${requireQuery(ctx.url, "eid")}`, {
        method: "GET",
      }),
  }),

  // 单集转录
  endpoint({
    id: "xiaoyuzhou-episode-transcript",
    platformId: "xiaoyuzhou",
    name: "单集转录",
    path: "/api/xiaoyuzhou/episode-transcript",
    params: [p("eid", true, ""), p("mediaId", true, "")],
    handler: (ctx) =>
      xiaoyuzhouRequest(ctx, "https://api.xiaoyuzhoufm.com/v1/episode-transcript/get", {
        method: "POST",
        contentType: "application/json",
        body: { eid: requireQuery(ctx.url, "eid"), mediaId: requireQuery(ctx.url, "mediaId") },
      }),
  }),

  // 订阅列表
  endpoint({
    id: "xiaoyuzhou-subscriptions",
    platformId: "xiaoyuzhou",
    name: "订阅列表",
    path: "/api/xiaoyuzhou/subscriptions",
    handler: (ctx) =>
      xiaoyuzhouRequest(ctx, "https://api.xiaoyuzhoufm.com/v1/subscription/list", {
        method: "POST",
        contentType: "application/json",
        body: { limit: "20", sortOrder: "desc", sortBy: "subscribedAt" },
      }),
  }),

  // 更新订阅
  endpoint({
    id: "xiaoyuzhou-update-subscription",
    platformId: "xiaoyuzhou",
    name: "更新订阅",
    path: "/api/xiaoyuzhou/update-subscription",
    params: [p("pid", true, ""), p("mode", false, "ON")],
    handler: (ctx) =>
      xiaoyuzhouRequest(ctx, "https://api.xiaoyuzhoufm.com/v1/subscription/update", {
        method: "POST",
        contentType: "application/json",
        body: { pid: requireQuery(ctx.url, "pid"), mode: getQuery(ctx.url, "mode", "ON") },
      }),
  }),

  // 发送验证码
  endpoint({
    id: "xiaoyuzhou-send-sms",
    platformId: "xiaoyuzhou",
    name: "发送验证码",
    method: "POST",
    path: "/api/xiaoyuzhou/send-sms",
    params: [p("phone", true, "13800138000"), p("countryCode", false, "86")],
    handler: async (ctx) => {
      const phone = requireQuery(ctx.url, "phone");
      const countryCode = getQuery(ctx.url, "countryCode", "86");
      const deviceId = cookie(ctx.configStore, "xiaoyuzhouDeviceId") || getDeviceId("");
      ctx.configStore.set("xiaoyuzhouDeviceId", deviceId);
      const response = await ctx.fetchImpl("https://api.xiaoyuzhoufm.com/v1/auth/send-sms", {
        method: "POST",
        headers: buildXiaoyuzhouHeaders({ deviceId, contentType: "application/json", localTime: nowIsoWithTimezone() }),
        body: JSON.stringify({ phone, countryCode }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 短信登录
  endpoint({
    id: "xiaoyuzhou-login-sms",
    platformId: "xiaoyuzhou",
    name: "短信登录",
    method: "POST",
    path: "/api/xiaoyuzhou/login-sms",
    params: [p("phone", true, "13800138000"), p("code", true, "123456"), p("countryCode", false, "86")],
    handler: async (ctx) => {
      const phone = requireQuery(ctx.url, "phone");
      const code = requireQuery(ctx.url, "code");
      const countryCode = getQuery(ctx.url, "countryCode", "86");
      const deviceId = cookie(ctx.configStore, "xiaoyuzhouDeviceId") || getDeviceId("");
      const response = await ctx.fetchImpl("https://api.xiaoyuzhoufm.com/v1/auth/login-by-sms", {
        method: "POST",
        headers: buildXiaoyuzhouHeaders({ deviceId, contentType: "application/json", localTime: nowIsoWithTimezone() }),
        body: JSON.stringify({ phone, code, countryCode }),
      });
      const auth = extractXiaoyuzhouAuth(Object.fromEntries(response.headers.entries()));
      if (auth.accessToken) ctx.configStore.set("xiaoyuzhouAccessToken", auth.accessToken);
      if (auth.refreshToken) ctx.configStore.set("xiaoyuzhouRefreshToken", auth.refreshToken);
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data: { ...data, auth: { accessToken: !!auth.accessToken, refreshToken: !!auth.refreshToken } } };
    },
  }),
];

module.exports = { xiaoyuzhouEndpoints };
