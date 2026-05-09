// 知乎平台端点
const { commonHeaders, fetchJson, readUpstreamJson } = require("../../upstream");
const { getZhihuSignature } = require("../../signers");
const { endpoint, p, getQuery, requireQuery, cookie } = require("../utils");

// 知乎签名请求辅助函数
async function zhihuSignedGet(ctx, pathOrUrl, { sign = true, extraHeaders = {} } = {}) {
  const cookieValue = cookie(ctx.configStore, "zhihuCookie");
  const requestUrl = pathOrUrl.startsWith("http") ? pathOrUrl : `https://www.zhihu.com${pathOrUrl}`;
  const signPath = pathOrUrl.startsWith("http")
    ? new URL(pathOrUrl).pathname + new URL(pathOrUrl).search
    : pathOrUrl;
  const headers = commonHeaders(cookieValue, {
    "x-zse-93": "101_3_3.0",
    "x-api-version": "3.0.91",
    ...extraHeaders,
  });
  if (sign) {
    const d_c0 = cookieValue.match(/(?:^|;\s*)d_c0=([^;]+)/)?.[1] || "";
    headers["x-zse-96"] = await getZhihuSignature(`101_3_3.0+${signPath}+${d_c0}`);
  }
  return fetchJson(ctx.fetchImpl, requestUrl, { headers });
}

// JSON handler 辅助函数
function jsonHandler(build) {
  return async (ctx) => {
    const request = await build(ctx);
    return fetchJson(ctx.fetchImpl, request.url, {
      method: request.method || "GET",
      headers: request.headers,
      body: request.body,
    });
  };
}

const zhihuEndpoints = [
  // 热榜
  endpoint({
    id: "zhihu-hot",
    platformId: "zhihu",
    name: "热榜",
    path: "/api/zhihu/hot",
    params: [p("nextUrl", false, "")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: getQuery(url, "nextUrl", "https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true"),
      headers: commonHeaders(cookie(configStore, "zhihuCookie"), { "x-api-version": "3.0.91" }),
    })),
  }),

  // 问题页面
  endpoint({
    id: "zhihu-question-page",
    platformId: "zhihu",
    name: "问题页面",
    path: "/api/zhihu/question-page",
    params: [p("questionId", true, "1932357580283437907")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: `https://www.zhihu.com/question/${requireQuery(url, "questionId")}`,
      headers: commonHeaders(cookie(configStore, "zhihuCookie")),
    })),
  }),

  // 推荐流
  endpoint({
    id: "zhihu-recommend-live",
    platformId: "zhihu",
    name: "推荐流",
    path: "/api/zhihu/recommend",
    params: [p("nextUrl", false, "")],
    handler: (ctx) => zhihuSignedGet(ctx, getQuery(ctx.url, "nextUrl", "/api/v3/feed/topstory/recommend?limit=10&desktop=true")),
  }),

  // 关注流
  endpoint({
    id: "zhihu-follow-live",
    platformId: "zhihu",
    name: "关注流",
    path: "/api/zhihu/follow",
    params: [p("nextUrl", false, "")],
    handler: (ctx) => zhihuSignedGet(ctx, getQuery(ctx.url, "nextUrl", "/api/v3/moments?limit=10&desktop=true")),
  }),

  // 回答评论
  endpoint({
    id: "zhihu-comments-live",
    platformId: "zhihu",
    name: "回答评论",
    path: "/api/zhihu/comments",
    params: [p("answerId", true, "1")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, `/api/v4/comment_v5/answers/${requireQuery(ctx.url, "answerId")}/root_comment?order_by=score&limit=100&offset=`),
  }),

  // 子评论
  endpoint({
    id: "zhihu-child-comments-live",
    platformId: "zhihu",
    name: "子评论",
    path: "/api/zhihu/child-comments",
    params: [p("commentId", true, "1")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, `/api/v4/comment_v5/comment/${requireQuery(ctx.url, "commentId")}/child_comment?order_by=ts&limit=20&offset=`),
  }),

  // 问题回答
  endpoint({
    id: "zhihu-question-feeds-live",
    platformId: "zhihu",
    name: "问题回答",
    path: "/api/zhihu/question-feeds",
    params: [p("questionId", true, "1932357580283437907"), p("order", false, "default")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, `/api/v4/questions/${requireQuery(ctx.url, "questionId")}/feeds?include=data[*].content&limit=30&offset=0&order=${getQuery(ctx.url, "order", "default")}&platform=desktop&ws_qiangzhisafe=0`),
  }),

  // 搜索
  endpoint({
    id: "zhihu-search-live",
    platformId: "zhihu",
    name: "搜索",
    path: "/api/zhihu/search",
    params: [p("query", true, "OpenAI")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, `/api/v4/search_v3?t=general&q=${encodeURIComponent(requireQuery(ctx.url, "query"))}&gk_version=gz-gaokao&correction=1&offset=0&limit=20&filter_fields=&lc_idx=0&show_all_topics=0&search_source=Normal`),
  }),

  // 热门问题
  endpoint({
    id: "zhihu-hot-questions-live",
    platformId: "zhihu",
    name: "热门问题",
    path: "/api/zhihu/hot-questions",
    params: [p("nextUrl", false, "")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, getQuery(ctx.url, "nextUrl", "/api/v4/creators/question_route/pc_member_related/hot?page_source=pc_panel&limit=20&offset=0&recom_domain_score_ab=1")),
  }),

  // 推荐流（新版）
  endpoint({
    id: "zhihu-recommend",
    platformId: "zhihu",
    name: "推荐流",
    path: "/api/zhihu/recommend",
    params: [p("nextUrl", false, "")],
    handler: (ctx) => zhihuSignedGet(ctx, getQuery(ctx.url, "nextUrl", "/api/v3/feed/topstory/recommend?limit=10&desktop=true")),
  }),

  // 关注流（新版）
  endpoint({
    id: "zhihu-follow",
    platformId: "zhihu",
    name: "关注流",
    path: "/api/zhihu/follow",
    params: [p("nextUrl", false, "")],
    handler: (ctx) => zhihuSignedGet(ctx, getQuery(ctx.url, "nextUrl", "/api/v3/moments?limit=10&desktop=true")),
  }),

  // 问题回答（新版）
  endpoint({
    id: "zhihu-question-feeds",
    platformId: "zhihu",
    name: "问题回答",
    path: "/api/zhihu/question-feeds",
    params: [p("questionId", true, "1932357580283437907"), p("order", false, "default")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, `/api/v4/questions/${requireQuery(ctx.url, "questionId")}/feeds?include=data[*].content&limit=30&offset=0&order=${getQuery(ctx.url, "order", "default")}&platform=desktop&ws_qiangzhisafe=0`),
  }),

  // 回答评论（新版）
  endpoint({
    id: "zhihu-comments",
    platformId: "zhihu",
    name: "回答评论",
    path: "/api/zhihu/comments",
    params: [p("answerId", true, "1")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, `/api/v4/comment_v5/answers/${requireQuery(ctx.url, "answerId")}/root_comment?order_by=score&limit=100&offset=`),
  }),

  // 子评论（新版）
  endpoint({
    id: "zhihu-child-comments",
    platformId: "zhihu",
    name: "子评论",
    path: "/api/zhihu/child-comments",
    params: [p("commentId", true, "1")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, `/api/v4/comment_v5/comment/${requireQuery(ctx.url, "commentId")}/child_comment?order_by=ts&limit=20&offset=`),
  }),

  // 搜索（新版）
  endpoint({
    id: "zhihu-search",
    platformId: "zhihu",
    name: "搜索",
    path: "/api/zhihu/search",
    params: [p("query", true, "OpenAI")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, `/api/v4/search_v3?t=general&q=${encodeURIComponent(requireQuery(ctx.url, "query"))}&gk_version=gz-gaokao&correction=1&offset=0&limit=20&filter_fields=&lc_idx=0&show_all_topics=0&search_source=Normal`),
  }),

  // 回答投票
  endpoint({
    id: "zhihu-vote",
    platformId: "zhihu",
    name: "回答投票",
    method: "POST",
    path: "/api/zhihu/vote",
    params: [p("answerId", true, "1"), p("voteType", true, "up")],
    handler: async (ctx) => {
      const answerId = requireQuery(ctx.url, "answerId");
      const voteType = requireQuery(ctx.url, "voteType");
      const cookieValue = cookie(ctx.configStore, "zhihuCookie");
      const d_c0 = cookieValue.match(/(?:^|;)\s*d_c0=([^;]+)/)?.[1] || "";
      const url = `https://www.zhihu.com/api/v4/zvideos/${answerId}/voters`;
      const signPath = `/api/v4/zvideos/${answerId}/voters`;
      const headers = commonHeaders(cookieValue, {
        "x-zse-93": "101_3_3.0",
        "x-api-version": "3.0.91",
        "content-type": "application/json",
        origin: "https://www.zhihu.com",
        referer: `https://www.zhihu.com/question/`,
      });
      headers["x-zse-96"] = await getZhihuSignature(`101_3_3.0+${signPath}+${d_c0}`);
      const response = await ctx.fetchImpl(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ type: voteType === "up" ? "up" : "down" }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 关注问题
  endpoint({
    id: "zhihu-follow-question",
    platformId: "zhihu",
    name: "关注问题",
    method: "POST",
    path: "/api/zhihu/follow-question",
    params: [p("questionId", true, "1")],
    handler: async (ctx) => {
      const questionId = requireQuery(ctx.url, "questionId");
      const cookieValue = cookie(ctx.configStore, "zhihuCookie");
      const d_c0 = cookieValue.match(/(?:^|;)\s*d_c0=([^;]+)/)?.[1] || "";
      const url = `https://www.zhihu.com/api/v4/questions/${questionId}/followers`;
      const signPath = `/api/v4/questions/${questionId}/followers`;
      const headers = commonHeaders(cookieValue, {
        "x-zse-93": "101_3_3.0",
        "x-api-version": "3.0.91",
        "content-type": "application/json",
        origin: "https://www.zhihu.com",
        referer: `https://www.zhihu.com/question/${questionId}`,
      });
      headers["x-zse-96"] = await getZhihuSignature(`101_3_3.0+${signPath}+${d_c0}`);
      const response = await ctx.fetchImpl(url, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 取消关注问题
  endpoint({
    id: "zhihu-unfollow-question",
    platformId: "zhihu",
    name: "取消关注问题",
    method: "DELETE",
    path: "/api/zhihu/unfollow-question",
    params: [p("questionId", true, "1")],
    handler: async (ctx) => {
      const questionId = requireQuery(ctx.url, "questionId");
      const cookieValue = cookie(ctx.configStore, "zhihuCookie");
      const d_c0 = cookieValue.match(/(?:^|;)\s*d_c0=([^;]+)/)?.[1] || "";
      const url = `https://www.zhihu.com/api/v4/questions/${questionId}/followers`;
      const signPath = `/api/v4/questions/${questionId}/followers`;
      const headers = commonHeaders(cookieValue, {
        "x-zse-93": "101_3_3.0",
        "x-api-version": "3.0.91",
        origin: "https://www.zhihu.com",
        referer: `https://www.zhihu.com/question/${questionId}`,
      });
      headers["x-zse-96"] = await getZhihuSignature(`101_3_3.0+${signPath}+${d_c0}`);
      const response = await ctx.fetchImpl(url, { method: "DELETE", headers });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 热门问题（新版）
  endpoint({
    id: "zhihu-hot-questions",
    platformId: "zhihu",
    name: "热门问题",
    path: "/api/zhihu/hot-questions",
    params: [p("nextUrl", false, "")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, getQuery(ctx.url, "nextUrl", "/api/v4/creators/question_route/pc_member_related/hot?page_source=pc_panel&limit=20&offset=0&recom_domain_score_ab=1")),
  }),

  // 上报已读
  endpoint({
    id: "zhihu-read-items",
    platformId: "zhihu",
    name: "上报已读",
    method: "POST",
    path: "/api/zhihu/read-items",
    params: [p("itemIds", true, "1,2,3")],
    handler: async (ctx) => {
      const itemIds = requireQuery(ctx.url, "itemIds").split(",").filter(Boolean);
      const cookieValue = cookie(ctx.configStore, "zhihuCookie");
      const d_c0 = cookieValue.match(/(?:^|;)\s*d_c0=([^;]+)/)?.[1] || "";
      const url = "https://www.zhihu.com/api/v3/feed/read-items";
      const signPath = "/api/v3/feed/read-items";
      const headers = commonHeaders(cookieValue, {
        "x-zse-93": "101_3_3.0",
        "x-api-version": "3.0.91",
        "content-type": "application/json",
        origin: "https://www.zhihu.com",
        referer: "https://www.zhihu.com/",
      });
      headers["x-zse-96"] = await getZhihuSignature(`101_3_3.0+${signPath}+${d_c0}`);
      const response = await ctx.fetchImpl(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ item_ids: itemIds }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),
];

module.exports = { zhihuEndpoints };
