// B站平台端点
const { commonHeaders, fetchJson, readUpstreamJson } = require("../../upstream");
const { endpoint, p, getQuery, requireQuery, cookie, userIdFromCookie, _csrfFromCookie } = require("../utils");

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

const bilibiliEndpoints = [
  // 登录二维码
  endpoint({
    id: "bilibili-qrcode",
    platformId: "bilibili",
    name: "登录二维码",
    path: "/api/bilibili/qrcode",
    handler: jsonHandler(() => ({
      url: "https://passport.bilibili.com/x/passport-login/web/qrcode/generate",
      headers: commonHeaders(""),
    })),
  }),

  // 轮询登录
  endpoint({
    id: "bilibili-qrcode-poll",
    platformId: "bilibili",
    name: "轮询登录",
    path: "/api/bilibili/qrcode/poll",
    params: [p("qrcode_key", true, "")],
    handler: jsonHandler(({ url }) => ({
      url: `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${requireQuery(url, "qrcode_key")}`,
      headers: commonHeaders(""),
    })),
  }),

  // 登录用户
  endpoint({
    id: "bilibili-nav",
    platformId: "bilibili",
    name: "登录用户",
    path: "/api/bilibili/nav",
    handler: jsonHandler(({ configStore }) => ({
      url: "https://api.bilibili.com/x/web-interface/nav",
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 热门视频
  endpoint({
    id: "bilibili-popular",
    platformId: "bilibili",
    name: "热门视频",
    path: "/api/bilibili/popular",
    params: [p("pn", false, "1"), p("ps", false, "20")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: `https://api.bilibili.com/x/web-interface/popular?pn=${getQuery(url, "pn", "1")}&ps=${getQuery(url, "ps", "20")}`,
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 直播列表
  endpoint({
    id: "bilibili-live-list",
    platformId: "bilibili",
    name: "直播列表",
    path: "/api/bilibili/live-list",
    params: [p("page", false, "1")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: `https://api.live.bilibili.com/room/v3/area/getRoomList?page=${getQuery(url, "page", "1")}&page_size=20&sort_type=online`,
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 关注直播
  endpoint({
    id: "bilibili-followed-live",
    platformId: "bilibili",
    name: "关注直播",
    path: "/api/bilibili/followed-live",
    params: [p("page", false, "1"), p("pageSize", false, "50")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: `https://api.live.bilibili.com/xlive/web-ucenter/v1/xfetter/FeedList?page=${getQuery(url, "page", "1")}&page_size=${getQuery(url, "pageSize", "50")}&platform=web`,
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 直播流
  endpoint({
    id: "bilibili-live-playurl",
    platformId: "bilibili",
    name: "直播流",
    path: "/api/bilibili/live-playurl",
    params: [p("roomId", true, "1"), p("qn", false, "10000")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: `https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id=${requireQuery(url, "roomId")}&protocol=0,1&format=0,1,2&codec=0&qn=${getQuery(url, "qn", "10000")}&platform=android`,
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 推荐视频
  endpoint({
    id: "bilibili-recommend",
    platformId: "bilibili",
    name: "推荐视频",
    path: "/api/bilibili/recommend",
    handler: jsonHandler(({ configStore }) => ({
      url: "https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd?web_location=1430650&y_num=5&fresh_type=3&feed_version=V8&homepage_ver=1&ps=10&last_y_num=5&screen=2010-595",
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 动态
  endpoint({
    id: "bilibili-dynamic",
    platformId: "bilibili",
    name: "动态",
    path: "/api/bilibili/dynamic",
    params: [p("page", false, "1"), p("offset", false, "")],
    handler: jsonHandler(({ url, configStore }) => {
      const offset = url.searchParams.get("offset");
      return {
        url: `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/all?type=video&platform=web&page=${getQuery(url, "page", "1")}${offset ? `&timezone_offset=-480&offset=${offset}` : ""}`,
        headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
      };
    }),
  }),

  // 稍后再看
  endpoint({
    id: "bilibili-watch-later",
    platformId: "bilibili",
    name: "稍后再看",
    path: "/api/bilibili/watch-later",
    params: [p("page", false, "1"), p("pageSize", false, "20")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: `https://api.bilibili.com/x/v2/history/toview/web?pn=${getQuery(url, "page", "1")}&ps=${getQuery(url, "pageSize", "20")}`,
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 收藏夹
  endpoint({
    id: "bilibili-favorites",
    platformId: "bilibili",
    name: "收藏夹",
    path: "/api/bilibili/favorites",
    handler: jsonHandler(({ configStore }) => ({
      url: `https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${userIdFromCookie(cookie(configStore, "bilibiliCookie"))}`,
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 收藏详情
  endpoint({
    id: "bilibili-favorite-detail",
    platformId: "bilibili",
    name: "收藏详情",
    path: "/api/bilibili/favorite-detail",
    params: [p("mediaId", true, "1"), p("page", false, "1"), p("pageSize", false, "20")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${requireQuery(url, "mediaId")}&pn=${getQuery(url, "page", "1")}&ps=${getQuery(url, "pageSize", "20")}`,
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 播放地址
  endpoint({
    id: "bilibili-playurl",
    platformId: "bilibili",
    name: "播放地址",
    path: "/api/bilibili/playurl",
    params: [p("bvid", true, "BV1xx411c7mD"), p("cid", true, "1")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: `https://api.bilibili.com/x/player/wbi/playurl?bvid=${requireQuery(url, "bvid")}&cid=${requireQuery(url, "cid")}&qn=112&platform=html5&high_quality=1`,
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 视频详情
  endpoint({
    id: "bilibili-video-info",
    platformId: "bilibili",
    name: "视频详情",
    path: "/api/bilibili/video-info",
    params: [p("bvid", true, "BV1xx411c7mD")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: `https://api.bilibili.com/x/web-interface/view?bvid=${requireQuery(url, "bvid")}`,
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 弹幕 XML
  endpoint({
    id: "bilibili-danmaku",
    platformId: "bilibili",
    name: "弹幕 XML",
    path: "/api/bilibili/danmaku",
    params: [p("cid", true, "1")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: `https://api.bilibili.com/x/v1/dm/list.so?oid=${requireQuery(url, "cid")}`,
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 搜索
  endpoint({
    id: "bilibili-search",
    platformId: "bilibili",
    name: "搜索",
    path: "/api/bilibili/search",
    params: [p("keyword", true, "音乐"), p("page", false, "1")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: `https://api.bilibili.com/x/web-interface/wbi/search/all/v2?keyword=${encodeURIComponent(requireQuery(url, "keyword"))}&page=${getQuery(url, "page", "1")}`,
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 用户视频
  endpoint({
    id: "bilibili-user-videos",
    platformId: "bilibili",
    name: "用户视频",
    path: "/api/bilibili/user-videos",
    params: [p("mid", true, "2"), p("page", false, "1")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: `https://api.bilibili.com/x/series/recArchivesByKeywords?mid=${requireQuery(url, "mid")}&keywords=&pn=${getQuery(url, "page", "1")}`,
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 用户卡片
  endpoint({
    id: "bilibili-user-card",
    platformId: "bilibili",
    name: "用户卡片",
    path: "/api/bilibili/user-card",
    params: [p("mid", true, "2")],
    handler: jsonHandler(({ url, configStore }) => ({
      url: `https://api.bilibili.com/x/web-interface/card?mid=${requireQuery(url, "mid")}`,
      headers: commonHeaders(cookie(configStore, "bilibiliCookie")),
    })),
  }),

  // 加入稍后再看
  endpoint({
    id: "bilibili-add-watch-later",
    platformId: "bilibili",
    name: "加入稍后再看",
    method: "POST",
    path: "/api/bilibili/add-watch-later",
    params: [p("bvid", true, "BV1xx411c7mD")],
    handler: async (ctx) => {
      const ck = cookie(ctx.configStore, "bilibiliCookie");
      const csrf = _csrfFromCookie(ck);
      if (!csrf) throw new Error("Cookie 中缺少 bili_jct (CSRF token)");
      const bvid = requireQuery(ctx.url, "bvid");
      const response = await ctx.fetchImpl("https://api.bilibili.com/x/v2/history/toview/add", {
        method: "POST",
        headers: commonHeaders(ck, {
          "content-type": "application/x-www-form-urlencoded",
          referer: "https://www.bilibili.com/",
          origin: "https://www.bilibili.com",
        }),
        body: new URLSearchParams({ bvid, csrf }).toString(),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 移除稍后再看
  endpoint({
    id: "bilibili-del-watch-later",
    platformId: "bilibili",
    name: "移除稍后再看",
    method: "POST",
    path: "/api/bilibili/del-watch-later",
    params: [p("bvid", true, "BV1xx411c7mD")],
    handler: async (ctx) => {
      const ck = cookie(ctx.configStore, "bilibiliCookie");
      const csrf = _csrfFromCookie(ck);
      if (!csrf) throw new Error("Cookie 中缺少 bili_jct (CSRF token)");
      const bvid = requireQuery(ctx.url, "bvid");
      const response = await ctx.fetchImpl("https://api.bilibili.com/x/v2/history/toview/del", {
        method: "POST",
        headers: commonHeaders(ck, {
          "content-type": "application/x-www-form-urlencoded",
          referer: "https://www.bilibili.com/",
          origin: "https://www.bilibili.com",
        }),
        body: new URLSearchParams({ bvid, csrf }).toString(),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 关注/取关
  endpoint({
    id: "bilibili-modify-relation",
    platformId: "bilibili",
    name: "关注/取关",
    method: "POST",
    path: "/api/bilibili/modify-relation",
    params: [p("fid", true, "2"), p("act", true, "1")],
    handler: async (ctx) => {
      const ck = cookie(ctx.configStore, "bilibiliCookie");
      const csrf = _csrfFromCookie(ck);
      if (!csrf) throw new Error("Cookie 中缺少 bili_jct (CSRF token)");
      const fid = requireQuery(ctx.url, "fid");
      const act = requireQuery(ctx.url, "act");
      const reSrc = "11";
      const response = await ctx.fetchImpl("https://api.bilibili.com/x/relation/modify", {
        method: "POST",
        headers: commonHeaders(ck, {
          "content-type": "application/x-www-form-urlencoded",
          referer: "https://space.bilibili.com/",
          origin: "https://space.bilibili.com",
        }),
        body: new URLSearchParams({ fid, act, re_src: reSrc, csrf }).toString(),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),
];

module.exports = { bilibiliEndpoints };
