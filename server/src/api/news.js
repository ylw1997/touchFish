const { commonHeaders, fetchJson, readUpstreamJson } = require("../upstream");
const {
  parseChiphellDetail,
  parseChiphellList,
  parseHupuDetail,
  parseHupuList,
  parseLinuxDoDetail,
  parseLinuxDoList,
  parseNgaDetail,
  parseNgaList,
  parseV2exDetail,
  parseV2exList,
} = require("../newsParsers");
const { endpoint, getQuery } = require("./utils");

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

async function fetchTextResult(fetchImpl, target, options = {}, encoding = "utf-8") {
  const response = await fetchImpl(target, options);
  const buffer = Buffer.from(await response.arrayBuffer());
  const text = new TextDecoder(encoding).decode(buffer);
  return { response, text };
}

function parsedHtmlHandler(build, parse, options = {}) {
  return async (ctx) => {
    const request = await build(ctx);
    const { response, text } = await fetchTextResult(
      ctx.fetchImpl,
      request.url,
      {
        method: request.method || "GET",
        headers: request.headers,
        body: request.body,
      },
      options.encoding || "utf-8",
    );
    return {
      ok: response.ok,
      status: response.status,
      url: request.url,
      data: parse(text, ctx),
    };
  };
}

const newsEndpoints = [
  // IT之家
  endpoint({
    id: "ithome-news",
    platformId: "ithome",
    name: "新闻列表",
    path: "/api/ithome/news",
    params: [getQuery.p?.("r", false, "0") || { name: "r", required: false, example: "0" }],
    handler: jsonHandler(({ url }) => ({
      url: `https://api.ithome.com/json/newslist/news?r=${getQuery(url, "r", "0")}`,
      headers: commonHeaders(""),
    })),
  }),
  endpoint({
    id: "ithome-detail",
    platformId: "ithome",
    name: "新闻详情",
    path: "/api/ithome/detail",
    params: [{ name: "id", required: true, example: "1" }],
    handler: jsonHandler(({ url }) => {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("缺少参数: id");
      return {
        url: `https://api.ithome.com/json/newscontent/${id}`,
        headers: commonHeaders(""),
      };
    }),
  }),

  // Chiphell
  endpoint({
    id: "chiphell-list",
    platformId: "chiphell",
    name: "列表",
    path: "/api/chiphell/list",
    params: [{ name: "page", required: false, example: "1" }],
    handler: parsedHtmlHandler(
      ({ url }) => ({
        url: `https://www.chiphell.com/forum.php?mod=guide&view=newthread&page=${getQuery(url, "page", "1")}`,
        headers: commonHeaders(""),
      }),
      parseChiphellList,
    ),
  }),
  endpoint({
    id: "chiphell-detail",
    platformId: "chiphell",
    name: "详情",
    path: "/api/chiphell/detail",
    params: [{ name: "url", required: true, example: "https://www.chiphell.com/thread-123-1-1.html" }],
    handler: parsedHtmlHandler(
      ({ url }) => {
        const target = url.searchParams.get("url");
        if (!target) throw new Error("缺少参数: url");
        return {
          url: target,
          headers: commonHeaders(""),
        };
      },
      parseChiphellDetail,
    ),
  }),

  // V2EX
  endpoint({
    id: "v2ex-list",
    platformId: "v2ex",
    name: "列表",
    path: "/api/v2ex/list",
    params: [{ name: "tab", required: false, example: "hot" }],
    handler: parsedHtmlHandler(
      ({ url }) => ({
        url: `https://www.v2ex.com/?tab=${getQuery(url, "tab", "hot")}`,
        headers: commonHeaders(""),
      }),
      parseV2exList,
    ),
  }),
  endpoint({
    id: "v2ex-detail",
    platformId: "v2ex",
    name: "详情",
    path: "/api/v2ex/detail",
    params: [{ name: "url", required: true, example: "https://www.v2ex.com/t/123" }],
    handler: parsedHtmlHandler(
      ({ url }) => {
        const target = url.searchParams.get("url");
        if (!target) throw new Error("缺少参数: url");
        return {
          url: target,
          headers: commonHeaders(""),
        };
      },
      parseV2exDetail,
    ),
  }),

  // 虎扑
  endpoint({
    id: "hupu-list",
    platformId: "hupu",
    name: "列表",
    path: "/api/hupu/list",
    params: [{ name: "page", required: false, example: "1" }],
    handler: parsedHtmlHandler(
      ({ url }) => ({
        url: `https://bbs.hupu.com/all-gambia${getQuery(url, "page", "1") > 1 ? `-${getQuery(url, "page", "1")}` : ""}`,
        headers: commonHeaders(""),
      }),
      parseHupuList,
    ),
  }),
  endpoint({
    id: "hupu-detail",
    platformId: "hupu",
    name: "详情",
    path: "/api/hupu/detail",
    params: [{ name: "url", required: true, example: "https://bbs.hupu.com/123.html" }],
    handler: parsedHtmlHandler(
      ({ url }) => {
        const target = url.searchParams.get("url");
        if (!target) throw new Error("缺少参数: url");
        return {
          url: target,
          headers: commonHeaders(""),
        };
      },
      parseHupuDetail,
    ),
  }),

  // NGA
  endpoint({
    id: "nga-list",
    platformId: "nga",
    name: "列表",
    path: "/api/nga/list",
    params: [{ name: "page", required: false, example: "1" }],
    handler: parsedHtmlHandler(
      ({ url }) => ({
        url: `https://bbs.nga.cn/thread.php?fid=-7&page=${getQuery(url, "page", "1")}`,
        headers: commonHeaders(""),
      }),
      parseNgaList,
    ),
  }),
  endpoint({
    id: "nga-detail",
    platformId: "nga",
    name: "详情",
    path: "/api/nga/detail",
    params: [{ name: "url", required: true, example: "https://bbs.nga.cn/read.php?tid=123" }],
    handler: parsedHtmlHandler(
      ({ url }) => {
        const target = url.searchParams.get("url");
        if (!target) throw new Error("缺少参数: url");
        return {
          url: target,
          headers: commonHeaders("", { "Accept-Charset": "GBK" }),
        };
      },
      parseNgaDetail,
      { encoding: "gbk" },
    ),
  }),

  // Linux.do
  endpoint({
    id: "linuxdo-list",
    platformId: "linuxdo",
    name: "列表",
    path: "/api/linuxdo/list",
    params: [{ name: "page", required: false, example: "0" }],
    handler: jsonHandler(({ url }) => ({
      url: `https://linux.do/latest.json?no_definitions=true&page=${getQuery(url, "page", "0")}`,
      headers: commonHeaders(""),
    })),
  }),
  endpoint({
    id: "linuxdo-detail",
    platformId: "linuxdo",
    name: "详情",
    path: "/api/linuxdo/detail",
    params: [{ name: "id", required: true, example: "123" }],
    handler: jsonHandler(({ url }) => {
      const id = url.searchParams.get("id");
      if (!id) throw new Error("缺少参数: id");
      return {
        url: `https://linux.do/t/${id}.json`,
        headers: commonHeaders(""),
      };
    }),
  }),
];

module.exports = { newsEndpoints };
