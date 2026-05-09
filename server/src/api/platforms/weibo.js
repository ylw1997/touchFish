// 微博平台端点
const { commonHeaders, fetchJson, readUpstreamJson } = require("../../upstream");
const { endpoint, p, getQuery, requireQuery, cookie } = require("../utils");

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

const weiboEndpoints = [
  // Feed
  endpoint({
    id: "weibo-feed",
    platformId: "weibo",
    name: "feed",
    path: "/api/weibo/feed",
    params: [p("path", false, "/allGroups")],
    handler: jsonHandler(({ url, configStore }) => {
      const ck = cookie(configStore, "weiboCookie");
      return {
        url: `https://weibo.com/ajax/feed${getQuery(url, "path", "/allGroups")}`,
        headers: commonHeaders(ck, { referer: "https://weibo.com/", "x-xsrf-token": ck.match(/XSRF-TOKEN=(.*?);/)?.[1] || "" }),
      };
    }),
  }),

  // 评论
  endpoint({
    id: "weibo-comment",
    platformId: "weibo",
    name: "评论",
    path: "/api/weibo/comment",
    params: [p("path", true, "/comments/hotflow?id=1")],
    handler: jsonHandler(({ url, configStore }) => {
      const ck = cookie(configStore, "weiboCookie");
      return { url: `https://weibo.com/ajax${requireQuery(url, "path")}`, headers: commonHeaders(ck, { referer: "https://weibo.com/" }) };
    }),
  }),

  // 长微博
  endpoint({
    id: "weibo-longtext",
    platformId: "weibo",
    name: "longtext",
    path: "/api/weibo/longtext",
    params: [p("id", true, "1")],
    handler: jsonHandler(({ url, configStore }) => {
      const ck = cookie(configStore, "weiboCookie");
      return { url: `https://weibo.com/ajax/statuses/longtext?id=${requireQuery(url, "id")}`, headers: commonHeaders(ck, { referer: "https://weibo.com/" }) };
    }),
  }),

  // 用户微博
  endpoint({
    id: "weibo-user",
    platformId: "weibo",
    name: "用户微博",
    path: "/api/weibo/user",
    params: [p("uid", true, "1"), p("page", false, "1")],
    handler: jsonHandler(({ url, configStore }) => {
      const ck = cookie(configStore, "weiboCookie");
      return { url: `https://weibo.com/ajax/statuses/mymblog?uid=${requireQuery(url, "uid")}&page=${getQuery(url, "page", "1")}&feature=0`, headers: commonHeaders(ck, { referer: "https://weibo.com/" }) };
    }),
  }),

  // 用户搜索
  endpoint({
    id: "weibo-user-by-name",
    platformId: "weibo",
    name: "用户搜索",
    path: "/api/weibo/user-by-name",
    params: [p("name", true, "人民日报")],
    handler: jsonHandler(({ url, configStore }) => {
      const ck = cookie(configStore, "weiboCookie");
      return { url: `https://weibo.com/ajax/profile/info?screen_name=${encodeURIComponent(requireQuery(url, "name"))}`, headers: commonHeaders(ck, { referer: "https://weibo.com/" }) };
    }),
  }),

  // 热搜
  endpoint({
    id: "weibo-hot-search",
    platformId: "weibo",
    name: "热搜",
    path: "/api/weibo/hot-search",
    handler: jsonHandler(({ configStore }) => {
      const ck = cookie(configStore, "weiboCookie");
      return { url: "https://weibo.com/ajax/side/hotSearch", headers: commonHeaders(ck, { referer: "https://weibo.com/" }) };
    }),
  }),

  // 微博搜索
  endpoint({
    id: "weibo-search",
    platformId: "weibo",
    name: "微博搜索",
    path: "/api/weibo/search",
    params: [p("keyword", true, "TouchFish")],
    handler: jsonHandler(({ url, configStore }) => {
      const ck = cookie(configStore, "weiboCookie");
      return { url: `https://s.weibo.com/weibo?q=${encodeURIComponent(requireQuery(url, "keyword"))}`, headers: commonHeaders(ck, { referer: "https://weibo.com/" }) };
    }),
  }),

  // 关注用户
  endpoint({
    id: "weibo-follow",
    platformId: "weibo",
    name: "关注用户",
    method: "POST",
    path: "/api/weibo/follow",
    params: [p("uid", true, "1")],
    handler: async (ctx) => {
      const ck = cookie(ctx.configStore, "weiboCookie");
      const csrf = ck.match(/XSRF-TOKEN=(.*?);/)?.[1] || "";
      if (!csrf) throw new Error("Cookie 中缺少 XSRF-TOKEN (CSRF token)");
      const uid = requireQuery(ctx.url, "uid");
      const response = await ctx.fetchImpl("https://weibo.com/ajax/friendships/create", {
        method: "POST",
        headers: commonHeaders(ck, {
          "content-type": "application/x-www-form-urlencoded",
          referer: "https://weibo.com/",
          "x-xsrf-token": csrf,
        }),
        body: new URLSearchParams({ uid, csrf_token: csrf }).toString(),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 取消关注
  endpoint({
    id: "weibo-unfollow",
    platformId: "weibo",
    name: "取消关注",
    method: "POST",
    path: "/api/weibo/unfollow",
    params: [p("uid", true, "1")],
    handler: async (ctx) => {
      const ck = cookie(ctx.configStore, "weiboCookie");
      const csrf = ck.match(/XSRF-TOKEN=(.*?);/)?.[1] || "";
      if (!csrf) throw new Error("Cookie 中缺少 XSRF-TOKEN (CSRF token)");
      const uid = requireQuery(ctx.url, "uid");
      const response = await ctx.fetchImpl("https://weibo.com/ajax/friendships/destroy", {
        method: "POST",
        headers: commonHeaders(ck, {
          "content-type": "application/x-www-form-urlencoded",
          referer: "https://weibo.com/",
          "x-xsrf-token": csrf,
        }),
        body: new URLSearchParams({ uid, csrf_token: csrf }).toString(),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 点赞
  endpoint({
    id: "weibo-like",
    platformId: "weibo",
    name: "点赞",
    method: "POST",
    path: "/api/weibo/like",
    params: [p("id", true, "1")],
    handler: async (ctx) => {
      const ck = cookie(ctx.configStore, "weiboCookie");
      const csrf = ck.match(/XSRF-TOKEN=(.*?);/)?.[1] || "";
      if (!csrf) throw new Error("Cookie 中缺少 XSRF-TOKEN (CSRF token)");
      const id = requireQuery(ctx.url, "id");
      const response = await ctx.fetchImpl("https://weibo.com/ajax/statuses/updateLike", {
        method: "POST",
        headers: commonHeaders(ck, {
          "content-type": "application/json",
          referer: "https://weibo.com/",
          "x-xsrf-token": csrf,
        }),
        body: JSON.stringify({ id, attitude: "heart", csrf_token: csrf }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 取消点赞
  endpoint({
    id: "weibo-unlike",
    platformId: "weibo",
    name: "取消点赞",
    method: "POST",
    path: "/api/weibo/unlike",
    params: [p("id", true, "1")],
    handler: async (ctx) => {
      const ck = cookie(ctx.configStore, "weiboCookie");
      const csrf = ck.match(/XSRF-TOKEN=(.*?);/)?.[1] || "";
      if (!csrf) throw new Error("Cookie 中缺少 XSRF-TOKEN (CSRF token)");
      const id = requireQuery(ctx.url, "id");
      const response = await ctx.fetchImpl("https://weibo.com/ajax/statuses/updateLike", {
        method: "POST",
        headers: commonHeaders(ck, {
          "content-type": "application/json",
          referer: "https://weibo.com/",
          "x-xsrf-token": csrf,
        }),
        body: JSON.stringify({ id, attitude: "unlike", csrf_token: csrf }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 发微博
  endpoint({
    id: "weibo-send",
    platformId: "weibo",
    name: "发微博",
    method: "POST",
    path: "/api/weibo/send",
    params: [p("content", true, "Hello World"), p("picIds", false, "")],
    handler: async (ctx) => {
      const ck = cookie(ctx.configStore, "weiboCookie");
      const csrf = ck.match(/XSRF-TOKEN=(.*?);/)?.[1] || "";
      if (!csrf) throw new Error("Cookie 中缺少 XSRF-TOKEN (CSRF token)");
      const content = requireQuery(ctx.url, "content");
      const picIds = getQuery(ctx.url, "picIds", "");
      const body = { content, csrf_token: csrf };
      if (picIds) body.pic_ids = picIds.split(",").filter(Boolean);
      const response = await ctx.fetchImpl("https://weibo.com/ajax/statuses/update", {
        method: "POST",
        headers: commonHeaders(ck, {
          "content-type": "application/json",
          referer: "https://weibo.com/",
          "x-xsrf-token": csrf,
        }),
        body: JSON.stringify(body),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 转发
  endpoint({
    id: "weibo-repost",
    platformId: "weibo",
    name: "转发",
    method: "POST",
    path: "/api/weibo/repost",
    params: [p("id", true, "1"), p("content", false, "")],
    handler: async (ctx) => {
      const ck = cookie(ctx.configStore, "weiboCookie");
      const csrf = ck.match(/XSRF-TOKEN=(.*?);/)?.[1] || "";
      if (!csrf) throw new Error("Cookie 中缺少 XSRF-TOKEN (CSRF token)");
      const id = requireQuery(ctx.url, "id");
      const content = getQuery(ctx.url, "content", "");
      const response = await ctx.fetchImpl("https://weibo.com/ajax/statuses/repost", {
        method: "POST",
        headers: commonHeaders(ck, {
          "content-type": "application/json",
          referer: "https://weibo.com/",
          "x-xsrf-token": csrf,
        }),
        body: JSON.stringify({ id, content, csrf_token: csrf }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 发表评论
  endpoint({
    id: "weibo-create-comment",
    platformId: "weibo",
    name: "发表评论",
    method: "POST",
    path: "/api/weibo/create-comment",
    params: [p("id", true, "1"), p("content", true, "评论内容")],
    handler: async (ctx) => {
      const ck = cookie(ctx.configStore, "weiboCookie");
      const csrf = ck.match(/XSRF-TOKEN=(.*?);/)?.[1] || "";
      if (!csrf) throw new Error("Cookie 中缺少 XSRF-TOKEN (CSRF token)");
      const id = requireQuery(ctx.url, "id");
      const content = requireQuery(ctx.url, "content");
      const response = await ctx.fetchImpl("https://weibo.com/ajax/comments/create", {
        method: "POST",
        headers: commonHeaders(ck, {
          "content-type": "application/json",
          referer: "https://weibo.com/",
          "x-xsrf-token": csrf,
        }),
        body: JSON.stringify({ id, content, csrf_token: csrf }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 上传图片
  endpoint({
    id: "weibo-upload-image",
    platformId: "weibo",
    name: "上传图片",
    method: "POST",
    path: "/api/weibo/upload-image",
    params: [p("imageData", true, "base64...")],
    handler: async (ctx) => {
      const ck = cookie(ctx.configStore, "weiboCookie");
      const csrf = ck.match(/XSRF-TOKEN=(.*?);/)?.[1] || "";
      if (!csrf) throw new Error("Cookie 中缺少 XSRF-TOKEN (CSRF token)");
      const imageData = requireQuery(ctx.url, "imageData");
      const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ""), "base64");
      const form = new FormData();
      form.append("file", new Blob([buffer]), "image.jpg");
      const response = await ctx.fetchImpl("https://weibo.com/ajax/photo/upload", {
        method: "POST",
        headers: commonHeaders(ck, {
          referer: "https://weibo.com/",
          "x-xsrf-token": csrf,
        }),
        body: form,
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 下载视频
  endpoint({
    id: "weibo-download-video",
    platformId: "weibo",
    name: "下载视频",
    method: "POST",
    path: "/api/weibo/download-video",
    params: [p("url", true, "")],
    handler: async (ctx) => {
      const videoUrl = requireQuery(ctx.url, "url");
      const response = await ctx.fetchImpl(videoUrl, { headers: commonHeaders("", { referer: "https://weibo.com/" }) });
      if (!response.ok) throw new Error(`下载失败: ${response.status}`);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return { ok: true, status: 200, data: { base64, size: buffer.byteLength } };
    },
  }),
];

module.exports = { weiboEndpoints };
