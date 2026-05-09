// 新闻类平台端点 (ithome, chiphell, v2ex, hupu, nga, linuxdo)
const { commonHeaders, fetchJson, readUpstreamJson } = require("../../upstream");
const { endpoint, p, getQuery, requireQuery, cookie } = require("../utils");
const { parseChiphellList, parseChiphellDetail, parseV2exList, parseV2exDetail, parseHupuList, parseHupuDetail, parseNgaList, parseNgaDetail, parseLinuxDoList, parseLinuxDoDetail } = require("../../newsParsers");

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

// 解析 HTML handler
function parsedHtmlHandler(build, parse, { encoding = "utf-8" } = {}) {
  return async (ctx) => {
    const request = await build(ctx);
    const response = await ctx.fetchImpl(request.url, {
      method: request.method || "GET",
      headers: request.headers,
      body: request.body,
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    const html = encoding === "gbk" ? buffer.toString("binary") : buffer.toString("utf-8");
    const parsed = parse(html, ctx);
    return { ok: response.ok, status: response.status, data: parsed };
  };
}

// 解析 JSON handler
function parsedJsonHandler(build, parse) {
  return async (ctx) => {
    const request = await build(ctx);
    const result = await fetchJson(ctx.fetchImpl, request.url, {
      method: request.method || "GET",
      headers: request.headers,
      body: request.body,
    });
    const parsed = parse(result.data, ctx);
    return { ...result, data: parsed };
  };
}

const newsEndpoints = [
  // IT之家
  endpoint({
    id: "ithome-news",
    platformId: "ithome",
    name: "新闻列表",
    path: "/api/ithome/news",
    handler: jsonHandler(() => ({ url: "https://api.ithome.com/json/newslist/news?r=0" })),
  }),
  endpoint({
    id: "ithome-detail",
    platformId: "ithome",
    name: "新闻详情",
    path: "/api/ithome/detail",
    params: [p("id", true, "123456")],
    handler: jsonHandler(({ url }) => ({ url: `https://api.ithome.com/json/newscontent/${requireQuery(url, "id")}` })),
  }),

  // Chiphell
  endpoint({
    id: "chiphell-list",
    platformId: "chiphell",
    name: "列表",
    path: "/api/chiphell/list",
    handler: parsedHtmlHandler(
      () => ({ url: "https://www.chiphell.com/forum.php?mod=guide&view=newthread" }),
      (html) => ({ items: parseChiphellList(html) }),
    ),
  }),
  endpoint({
    id: "chiphell-detail",
    platformId: "chiphell",
    name: "详情",
    path: "/api/chiphell/detail",
    params: [p("url", true, "https://www.chiphell.com/thread-1-1-1.html")],
    handler: parsedHtmlHandler(({ url }) => ({ url: requireQuery(url, "url") }), parseChiphellDetail),
  }),

  // V2EX
  endpoint({
    id: "v2ex-list",
    platformId: "v2ex",
    name: "列表",
    path: "/api/v2ex/list",
    params: [p("tab", false, "all")],
    handler: parsedHtmlHandler(
      ({ url }) => ({ url: `https://www.v2ex.com/?tab=${getQuery(url, "tab", "all")}` }),
      (html) => ({ items: parseV2exList(html) }),
    ),
  }),
  endpoint({
    id: "v2ex-detail",
    platformId: "v2ex",
    name: "详情",
    path: "/api/v2ex/detail",
    params: [p("url", true, "https://www.v2ex.com/t/1"), p("page", false, "1")],
    handler: parsedHtmlHandler(({ url }) => {
      const target = new URL(requireQuery(url, "url"));
      if (url.searchParams.get("page")) target.searchParams.set("p", url.searchParams.get("page"));
      return { url: target.toString() };
    }, parseV2exDetail),
  }),

  // 虎扑
  endpoint({
    id: "hupu-list",
    platformId: "hupu",
    name: "列表",
    path: "/api/hupu/list",
    params: [p("tab", false, "all-gambia")],
    handler: parsedHtmlHandler(
      ({ url }) => ({
        url: `https://bbs.hupu.com/${getQuery(url, "tab", "all-gambia")}`,
        headers: commonHeaders("", { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }),
      }),
      (html, ctx) => ({ items: parseHupuList(html, getQuery(ctx.url, "tab", "all-gambia")) }),
    ),
  }),
  endpoint({
    id: "hupu-detail",
    platformId: "hupu",
    name: "详情",
    path: "/api/hupu/detail",
    params: [p("url", true, "https://bbs.hupu.com/1.html"), p("page", false, "1")],
    handler: parsedHtmlHandler(({ url }) => ({ url: requireQuery(url, "url"), headers: commonHeaders("") }), parseHupuDetail),
  }),

  // NGA
  endpoint({
    id: "nga-list",
    platformId: "nga",
    name: "列表",
    path: "/api/nga/list",
    params: [p("fid", false, "-7")],
    handler: parsedHtmlHandler(({ url, configStore }) => ({
      url: `https://bbs.nga.cn/thread.php?fid=${getQuery(url, "fid", "-7")}&page=1`,
      headers: commonHeaders(cookie(configStore, "ngaCookie"), { referer: "https://bbs.nga.cn/" }),
    }), (html) => ({ items: parseNgaList(html) }), { encoding: "gbk" }),
  }),
  endpoint({
    id: "nga-detail",
    platformId: "nga",
    name: "详情",
    path: "/api/nga/detail",
    params: [p("tid", true, "1"), p("page", false, "1")],
    handler: parsedHtmlHandler(({ url, configStore }) => ({
      url: `https://bbs.nga.cn/read.php?tid=${requireQuery(url, "tid")}&page=${getQuery(url, "page", "1")}`,
      headers: commonHeaders(cookie(configStore, "ngaCookie"), { referer: "https://bbs.nga.cn/" }),
    }), parseNgaDetail, { encoding: "gbk" }),
  }),

  // Linux.do
  endpoint({
    id: "linuxdo-list",
    platformId: "linuxdo",
    name: "列表",
    path: "/api/linuxdo/list",
    params: [p("tab", false, "latest")],
    handler: parsedJsonHandler(({ url, configStore }) => ({
      url: `https://linux.do/${getQuery(url, "tab", "latest")}.json`,
      headers: commonHeaders(cookie(configStore, "linuxDoCookie"), { referer: "https://linux.do/" }),
    }), (data) => ({ items: parseLinuxDoList(data) })),
  }),
  endpoint({
    id: "linuxdo-detail",
    platformId: "linuxdo",
    name: "详情",
    path: "/api/linuxdo/detail",
    params: [p("topicId", true, "1")],
    handler: parsedJsonHandler(({ url, configStore }) => ({
      url: `https://linux.do/t/${requireQuery(url, "topicId")}.json`,
      headers: commonHeaders(cookie(configStore, "linuxDoCookie"), { referer: "https://linux.do/" }),
    }), parseLinuxDoDetail),
  }),
];

module.exports = { newsEndpoints };
