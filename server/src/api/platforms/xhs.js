// 小红书平台端点
const { fetchJson, readUpstreamJson } = require("../../upstream");
const { endpoint, p, getQuery, requireQuery, cookie } = require("../utils");
const { getXhsSignature } = require("../../signers");

// 小红书请求头
function xhsHeaders(cookieValue, signObj, host = "edith.xiaohongshu.com") {
  return {
    cookie: cookieValue,
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "content-type": "application/json;charset=UTF-8",
    "x-s": signObj.xs,
    "x-t": String(signObj.xt),
    "x-s-common": signObj.xs_common,
    xsecappid: "xhs-pc-web",
    authority: host,
    referer: "https://www.xiaohongshu.com/",
    accept: "application/json, text/plain, */*",
    origin: "https://www.xiaohongshu.com",
  };
}

// 构建带查询参数的 GET 路径
function xhsGetPath(apiPath, query) {
  if (!query || Object.keys(query).length === 0) return apiPath;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  return `${apiPath}?${params.toString()}`;
}

// 稳定字符串化
function stableStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map(stableStringify).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((k) => `"${k}":${stableStringify(obj[k])}`);
  return "{" + pairs.join(",") + "}";
}

// 小红书请求辅助函数
async function xhsRequest(ctx, apiPath, { method = "POST", body = {}, query = {}, host = "edith.xiaohongshu.com" } = {}) {
  const cookieValue = cookie(ctx.configStore, "xhsCookie");
  if (!cookieValue) {
    const error = new Error("缺少 xhsCookie");
    error.statusCode = 400;
    throw error;
  }
  const pathWithQuery = method === "GET" ? xhsGetPath(apiPath, query) : apiPath;
  const bodyString = method === "GET" ? "" : stableStringify(body);
  const signPayload = method === "GET" ? "" : JSON.parse(bodyString || "{}");
  const signObj = await getXhsSignature(pathWithQuery, signPayload, cookieValue, method);
  return fetchJson(ctx.fetchImpl, `https://${host}${pathWithQuery}`, {
    method,
    headers: xhsHeaders(cookieValue, signObj, host),
    body: method === "GET" ? undefined : bodyString,
  });
}

const xhsEndpoints = [
  // Feed
  endpoint({
    id: "xhs-feed",
    platformId: "xhs",
    name: "首页推荐",
    path: "/api/xhs/feed",
    params: [p("cursor", false, "")],
    handler: (ctx) =>
      xhsRequest(ctx, "/api/sns/web/v1/homefeed", {
        body: {
          cursor_score: getQuery(ctx.url, "cursor", ""),
          num: 20,
          refresh_type: 1,
          note_index: 0,
          unread_begin_note_id: "",
          unread_end_note_id: "",
          unread_note_count: 0,
          category: "homefeed_recommend",
          search_key: "",
          need_num: 10,
          image_formats: ["jpg", "webp", "avif"],
          need_filter_image: false,
        },
      }),
  }),

  // 详情
  endpoint({
    id: "xhs-detail",
    platformId: "xhs",
    name: "笔记详情",
    path: "/api/xhs/detail",
    params: [p("source_note_id", true, ""), p("xsec_token", true, "")],
    handler: (ctx) =>
      xhsRequest(ctx, "/api/sns/web/v1/feed", {
        body: {
          extra: { need_body_topic: "1" },
          image_formats: ["jpg", "webp", "avif"],
          source_note_id: requireQuery(ctx.url, "source_note_id"),
          xsec_source: "pc_feed",
          xsec_token: requireQuery(ctx.url, "xsec_token"),
        },
      }),
  }),

  // 评论
  endpoint({
    id: "xhs-comments",
    platformId: "xhs",
    name: "评论列表",
    path: "/api/xhs/comments",
    params: [p("note_id", true, ""), p("xsec_token", true, ""), p("cursor", false, "")],
    handler: (ctx) =>
      xhsRequest(ctx, "/api/sns/web/v2/comment/page", {
        method: "GET",
        query: {
          note_id: requireQuery(ctx.url, "note_id"),
          cursor: getQuery(ctx.url, "cursor", ""),
          top_comment_id: "",
          image_formats: "jpg,webp,avif",
          xsec_token: requireQuery(ctx.url, "xsec_token"),
        },
      }),
  }),

  // 子评论
  endpoint({
    id: "xhs-sub-comments",
    platformId: "xhs",
    name: "子评论",
    path: "/api/xhs/sub-comments",
    params: [p("note_id", true, ""), p("root_comment_id", true, ""), p("xsec_token", true, ""), p("cursor", false, "")],
    handler: (ctx) =>
      xhsRequest(ctx, "/api/sns/web/v2/comment/sub/page", {
        method: "GET",
        query: {
          note_id: requireQuery(ctx.url, "note_id"),
          root_comment_id: requireQuery(ctx.url, "root_comment_id"),
          num: 10,
          cursor: getQuery(ctx.url, "cursor", ""),
          image_formats: "jpg,webp,avif",
          xsec_token: requireQuery(ctx.url, "xsec_token"),
        },
      }),
  }),

  // 搜索
  endpoint({
    id: "xhs-search",
    platformId: "xhs",
    name: "搜索笔记",
    path: "/api/xhs/search",
    params: [p("keyword", true, "咖啡"), p("page", false, "1")],
    handler: (ctx) =>
      xhsRequest(ctx, "/api/sns/web/v1/search/notes", {
        body: {
          keyword: requireQuery(ctx.url, "keyword"),
          page: Number(getQuery(ctx.url, "page", "1")),
          page_size: 20,
          search_id: Math.random().toString(16).slice(2, 18),
          sort: "general",
          note_type: 0,
          ext_flags: [],
          geo: "",
          image_formats: ["jpg", "webp", "avif"],
        },
      }),
  }),

  // 我
  endpoint({
    id: "xhs-me",
    platformId: "xhs",
    name: "我的信息",
    path: "/api/xhs/me",
    handler: (ctx) => xhsRequest(ctx, "/api/sns/web/v2/user/me", { method: "GET" }),
  }),

  // 用户发布
  endpoint({
    id: "xhs-user-posted",
    platformId: "xhs",
    name: "用户发布",
    path: "/api/xhs/user-posted",
    params: [p("user_id", true, ""), p("xsec_token", true, ""), p("cursor", false, "")],
    handler: (ctx) =>
      xhsRequest(ctx, "/api/sns/web/v1/user_posted", {
        method: "GET",
        query: {
          num: "30",
          cursor: getQuery(ctx.url, "cursor", ""),
          user_id: requireQuery(ctx.url, "user_id"),
          image_formats: "jpg,webp,avif",
          xsec_token: requireQuery(ctx.url, "xsec_token"),
          xsec_source: "pc_feed",
        },
      }),
  }),

  // 悬浮卡片
  endpoint({
    id: "xhs-hover-card",
    platformId: "xhs",
    name: "悬浮卡片",
    method: "POST",
    path: "/api/xhs/hover-card",
    params: [p("user_id", true, "")],
    handler: (ctx) => xhsRequest(ctx, "/api/sns/web/v1/user/hover_card", { body: { user_id: requireQuery(ctx.url, "user_id") } }),
  }),

  // 关注
  endpoint({
    id: "xhs-follow",
    platformId: "xhs",
    name: "关注用户",
    method: "POST",
    path: "/api/xhs/follow",
    params: [p("user_id", true, "")],
    handler: (ctx) => xhsRequest(ctx, "/api/sns/web/v1/user/follow", { body: { user_id: requireQuery(ctx.url, "user_id") } }),
  }),

  // 取消关注
  endpoint({
    id: "xhs-unfollow",
    platformId: "xhs",
    name: "取消关注",
    method: "POST",
    path: "/api/xhs/unfollow",
    params: [p("user_id", true, "")],
    handler: (ctx) => xhsRequest(ctx, "/api/sns/web/v1/user/unfollow", { body: { user_id: requireQuery(ctx.url, "user_id") } }),
  }),

  // 点赞
  endpoint({
    id: "xhs-like",
    platformId: "xhs",
    name: "点赞笔记",
    method: "POST",
    path: "/api/xhs/like",
    params: [p("note_id", true, "")],
    handler: (ctx) => xhsRequest(ctx, "/api/sns/web/v1/note/like", { body: { note_id: requireQuery(ctx.url, "note_id") } }),
  }),

  // 取消点赞
  endpoint({
    id: "xhs-dislike",
    platformId: "xhs",
    name: "取消点赞",
    method: "POST",
    path: "/api/xhs/dislike",
    params: [p("note_id", true, "")],
    handler: (ctx) => xhsRequest(ctx, "/api/sns/web/v1/note/dislike", { body: { note_id: requireQuery(ctx.url, "note_id") } }),
  }),

  // 收藏
  endpoint({
    id: "xhs-collect",
    platformId: "xhs",
    name: "收藏笔记",
    method: "POST",
    path: "/api/xhs/collect",
    params: [p("note_id", true, "")],
    handler: (ctx) => xhsRequest(ctx, "/api/sns/web/v1/note/collect", { body: { note_id: requireQuery(ctx.url, "note_id") } }),
  }),

  // 取消收藏
  endpoint({
    id: "xhs-uncollect",
    platformId: "xhs",
    name: "取消收藏",
    method: "POST",
    path: "/api/xhs/uncollect",
    params: [p("note_id", true, "")],
    handler: (ctx) => xhsRequest(ctx, "/api/sns/web/v1/note/uncollect", { body: { note_id: requireQuery(ctx.url, "note_id") } }),
  }),

  // 发表评论
  endpoint({
    id: "xhs-post-comment",
    platformId: "xhs",
    name: "发表评论",
    method: "POST",
    path: "/api/xhs/post-comment",
    params: [p("note_id", true, ""), p("content", true, ""), p("target_comment_id", false, "")],
    handler: (ctx) =>
      xhsRequest(ctx, "/api/sns/web/v1/comment/post", {
        body: {
          note_id: requireQuery(ctx.url, "note_id"),
          content: requireQuery(ctx.url, "content"),
          target_comment_id: getQuery(ctx.url, "target_comment_id", ""),
        },
      }),
  }),

  // 上传许可
  endpoint({
    id: "xhs-upload-permit",
    platformId: "xhs",
    name: "upload-permit",
    method: "POST",
    path: "/api/xhs/upload-permit",
    params: [p("file_type", false, "image")],
    handler: (ctx) => xhsRequest(ctx, "/api/media/v1/upload/creator/permit", { body: { file_type: getQuery(ctx.url, "file_type", "image") } }),
  }),

  // 上传图片
  endpoint({
    id: "xhs-upload-image",
    platformId: "xhs",
    name: "upload-image",
    method: "POST",
    path: "/api/xhs/upload-image",
    params: [p("imageData", true, "base64..."), p("fileName", false, "image.jpg")],
    handler: async (ctx) => {
      const imageData = requireQuery(ctx.url, "imageData");
      const fileName = getQuery(ctx.url, "fileName", "image.jpg");
      const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ""), "base64");
      const cookieValue = cookie(ctx.configStore, "xhsCookie");
      const signObj = await getXhsSignature("/api/media/v1/upload/web-image", buffer, "POST", cookieValue);
      const host = "https://edith.xiaohongshu.com";
      const form = new FormData();
      form.append("file", new Blob([buffer], { type: "image/jpeg" }), fileName);
      const response = await ctx.fetchImpl(`${host}/api/media/v1/upload/web-image`, {
        method: "POST",
        headers: {
          ...xhsHeaders(cookieValue, signObj, host),
          "content-type": undefined,
        },
        body: form,
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 发布笔记
  endpoint({
    id: "xhs-publish-note",
    platformId: "xhs",
    name: "publish-note",
    method: "POST",
    path: "/api/xhs/publish-note",
    params: [p("title", true, ""), p("desc", true, ""), p("images", true, "[]")],
    handler: (ctx) =>
      xhsRequest(ctx, "/web_api/sns/v2/note", {
        body: {
          title: requireQuery(ctx.url, "title"),
          desc: requireQuery(ctx.url, "desc"),
          images: JSON.parse(getQuery(ctx.url, "images", "[]")),
        },
      }),
  }),
];

module.exports = { xhsEndpoints };
