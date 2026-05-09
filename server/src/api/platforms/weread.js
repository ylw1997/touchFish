// 微信读书平台端点
const { commonHeaders, fetchJson, readUpstreamJson } = require("../../upstream");
const { endpoint, p, getQuery, requireQuery, cookie } = require("../utils");

// 微信读书请求头
function wereadHeaders(configStore) {
  return commonHeaders(cookie(configStore, "wereadCookie"), {
    referer: "https://weread.qq.com/",
    "content-type": "application/json",
  });
}

// 更新 cookie 中的特定字段
function updateCookie(oldCookie, newValues) {
  const cookieParts = oldCookie.split(";").map(p => p.trim());
  const cookieMap = {};
  
  for (const part of cookieParts) {
    const [name, value] = part.split("=");
    if (name && value) {
      cookieMap[name.trim()] = value.trim();
    }
  }
  
  // 更新新值
  for (const [name, value] of Object.entries(newValues)) {
    cookieMap[name] = value;
  }
  
  // 重新拼接
  return Object.entries(cookieMap).map(([k, v]) => `${k}=${v}`).join("; ");
}

// 判断是否登录超时
function isLoginTimeout(result) {
  if (!result) return false;
  return result.errCode === -2012 || result.errCode === -2013 || result.errCode === -12013;
}

// 刷新 cookie
async function refreshCookie(ctx) {
  const oldCookie = cookie(ctx.configStore, "wereadCookie");
  if (!oldCookie) {
    throw new Error("缺少 wereadCookie");
  }
  
  // 调用 renewal 接口刷新
  const response = await ctx.fetchImpl("https://weread.qq.com/web/login/renewal", {
    method: "POST",
    headers: wereadHeaders(ctx.configStore),
    body: JSON.stringify({ rq: encodeURIComponent("https://weread.qq.com/") }),
  });
  
  const data = await readUpstreamJson(response);
  
  if (data.succ === 1) {
    // 从 Set-Cookie 中提取新值
    const setCookie = response.headers.get("set-cookie") || "";
    const newValues = {};
    
    // 解析 Set-Cookie：多个 cookie 用逗号分隔，每个 cookie 的第一个部分是 name=value
    const cookieParts = setCookie.split(",");
    for (const part of cookieParts) {
      // 每个 cookie 的格式是 "name=value; Max-Age=...; Domain=...; ..."
      const firstPart = part.trim().split(";")[0];
      const [name, value] = firstPart.split("=");
      if (name === "wr_vid") newValues.wr_vid = value;
      else if (name === "wr_skey") newValues.wr_skey = value;
      else if (name === "wr_rt") newValues.wr_rt = value;
    }
    
    if (Object.keys(newValues).length > 0) {
      const newCookie = updateCookie(oldCookie, newValues);
      // 保存新 cookie
      ctx.configStore.set("wereadCookie", newCookie);
      console.log("✅ 微信读书 Cookie 刷新成功:", newValues);
      return newCookie;
    }
  }
  
  throw new Error(data.errMsg || "Cookie 刷新失败");
}

// 微信读书请求辅助函数（带自动刷新）
async function wereadRequest(ctx, target, { method = "GET", body } = {}) {
  const result = await fetchJson(ctx.fetchImpl, target, {
    method,
    headers: wereadHeaders(ctx.configStore),
    body: body ? JSON.stringify(body) : undefined,
  });
  
  // 检查是否登录超时
  if (isLoginTimeout(result.data)) {
    console.log("🔄 检测到微信读书登录超时，尝试刷新 Cookie...");
    try {
      await refreshCookie(ctx);
      // 刷新后重试
      return await fetchJson(ctx.fetchImpl, target, {
        method,
        headers: wereadHeaders(ctx.configStore),
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      console.error("❌ Cookie 刷新失败:", e.message);
      return result;
    }
  }
  
  return result;
}

// 基础端点数组
const baseEndpoints = [
  // 登录相关
  ["login-getuid", "POST", "https://weread.qq.com/web/login/getuid"],
  ["login-getinfo", "POST", (ctx) => "https://weread.qq.com/web/login/getinfo", (ctx) => ({ uid: requireQuery(ctx.url, "uid") }), [p("uid", true, "")]],
  ["login-notify", "GET", "https://weread.qq.com/web/login/notify"],
  ["shelf-sync", "GET", "https://weread.qq.com/web/shelf/sync"],
  ["shelf-sync-book", "POST", "https://weread.qq.com/web/shelf/syncBook", (ctx) => ({ bookIds: getQuery(ctx.url, "bookIds", "").split(",").filter(Boolean) }), [p("bookIds", false, "")]],
  ["shelf-book-ids", "GET", (ctx) => `https://weread.qq.com/web/shelf/bookIds?bookIds=${encodeURIComponent(getQuery(ctx.url, "bookIds", ""))}`, null, [p("bookIds", false, "")]],
  ["shelf-add-to-shelf", "POST", "https://weread.qq.com/mp/shelf/addToShelf", (ctx) => ({ bookIds: getQuery(ctx.url, "bookIds", "").split(",").filter(Boolean) }), [p("bookIds", true, "")]],
  ["shelf-add", "POST", "https://weread.qq.com/web/shelf/add", (ctx) => ({ bookIds: getQuery(ctx.url, "bookIds", "").split(",").filter(Boolean) }), [p("bookIds", true, "")]],
  ["book-info", "GET", (ctx) => `https://weread.qq.com/web/book/info?bookId=${encodeURIComponent(requireQuery(ctx.url, "bookId"))}`, null, [p("bookId", true, "")]],
  ["book-publicinfos", "POST", "https://weread.qq.com/web/book/publicinfos", (ctx) => ({ bookIds: getQuery(ctx.url, "bookIds", "").split(",").filter(Boolean) }), [p("bookIds", true, "")]],
  ["book-search", "GET", "https://weread.qq.com/web/book/search"],
  ["book-chapter-infos", "POST", "https://weread.qq.com/web/book/chapterInfos", (ctx) => ({ bookIds: getQuery(ctx.url, "bookIds", "").split(",").filter(Boolean) }), [p("bookIds", true, "")]],
  ["book-progress", "GET", (ctx) => `https://weread.qq.com/web/book/getProgress?bookId=${encodeURIComponent(requireQuery(ctx.url, "bookId"))}`, null, [p("bookId", true, "")]],
  ["book-bookmarklist", "GET", (ctx) => `https://weread.qq.com/web/book/bookmarklist?bookId=${encodeURIComponent(requireQuery(ctx.url, "bookId"))}`, null, [p("bookId", true, "")]],
  ["book-read-reviews", "GET", (ctx) => `https://weread.qq.com/web/review/list?bookId=${encodeURIComponent(requireQuery(ctx.url, "bookId"))}`, null, [p("bookId", true, "")]],
  ["book-underlines", "GET", (ctx) => `https://weread.qq.com/web/book/bookmarklist?bookId=${encodeURIComponent(requireQuery(ctx.url, "bookId"))}`, null, [p("bookId", true, "")]],
  ["categories", "GET", "https://weread.qq.com/web/book/categories"],
  ["recommend-books", "GET", "https://weread.qq.com/web/book/recommend"],
  ["config", "GET", "https://weread.qq.com/web/config"],
  ["pay-balance", "GET", "https://weread.qq.com/web/pay/balance?pf=ios"],
  ["pay-member-card-summary", "GET", "https://weread.qq.com/web/pay/memberCardSummary?pf=ios"],
  ["user", "GET", (ctx) => `https://weread.qq.com/web/user?userVid=${encodeURIComponent(requireQuery(ctx.url, "vid"))}`, null, [p("vid", true, "")]],
];

// 路由名称映射表
const routeNameMap = {
  "login-getuid": "获取登录UID",
  "login-getinfo": "获取登录信息",
  "login-notify": "登录通知",
  "shelf-sync": "同步书架",
  "shelf-sync-book": "同步书籍",
  "shelf-book-ids": "书籍ID列表",
  "shelf-add-to-shelf": "添加到书架",
  "shelf-add": "添加书架",
  "book-info": "书籍信息",
  "book-publicinfos": "书籍公开信息",
  "book-search": "搜索书籍",
  "book-chapter-infos": "章节信息",
  "book-progress": "阅读进度",
  "book-bookmarklist": "书签列表",
  "book-read-reviews": "书评列表",
  "book-underlines": "划线列表",
  "categories": "分类列表",
  "recommend-books": "推荐书籍",
  "config": "配置信息",
  "pay-balance": "账户余额",
  "pay-member-card-summary": "会员卡信息",
  "user": "用户信息",
};

// 从基础端点数组生成端点
const generatedEndpoints = baseEndpoints.map(([route, method, target, buildBody, params = []]) =>
  endpoint({
    id: `weread-${route}`,
    platformId: "weread",
    name: routeNameMap[route] || route,
    path: `/api/weread/${route}`,
    params,
    handler: (ctx) =>
      wereadRequest(ctx, typeof target === "function" ? target(ctx) : target, {
        method,
        body: buildBody ? buildBody(ctx) : undefined,
      }),
  }),
);

// 额外的端点
const additionalEndpoints = [
  // 登录确认
  endpoint({
    id: "weread-login-confirm",
    platformId: "weread",
    name: "登录确认",
    method: "POST",
    path: "/api/weread/login-confirm",
    params: [p("uid", true, ""), p("code", true, "")],
    handler: async (ctx) => {
      const uid = requireQuery(ctx.url, "uid");
      const code = requireQuery(ctx.url, "code");
      const response = await ctx.fetchImpl("https://weread.qq.com/web/login/confirm", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ uid, code }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 网页登录
  endpoint({
    id: "weread-login-weblogin",
    platformId: "weread",
    name: "网页登录",
    method: "POST",
    path: "/api/weread/login-weblogin",
    params: [p("uid", true, ""), p("code", true, "")],
    handler: async (ctx) => {
      const uid = requireQuery(ctx.url, "uid");
      const code = requireQuery(ctx.url, "code");
      const response = await ctx.fetchImpl("https://weread.qq.com/web/login/weblogin", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ uid, code }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 初始化会话
  endpoint({
    id: "weread-login-session-init",
    platformId: "weread",
    name: "初始化会话",
    method: "POST",
    path: "/api/weread/login-session-init",
    handler: async (ctx) => {
      const response = await ctx.fetchImpl("https://weread.qq.com/web/login/session/init", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({}),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 续期登录
  endpoint({
    id: "weread-login-renewal",
    platformId: "weread",
    name: "续期登录",
    method: "POST",
    path: "/api/weread/login-renewal",
    handler: async (ctx) => {
      const response = await ctx.fetchImpl("https://weread.qq.com/web/login/renewal", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({}),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 初始化阅读
  endpoint({
    id: "weread-book-read-init",
    platformId: "weread",
    name: "初始化阅读",
    method: "POST",
    path: "/api/weread/book-read-init",
    params: [p("bookId", true, ""), p("chapterId", true, "")],
    handler: async (ctx) => {
      const bookId = requireQuery(ctx.url, "bookId");
      const chapterId = requireQuery(ctx.url, "chapterId");
      const response = await ctx.fetchImpl("https://weread.qq.com/web/book/read", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ bookId, chapterId }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 阅读书籍
  endpoint({
    id: "weread-book-read",
    platformId: "weread",
    name: "阅读书籍",
    method: "POST",
    path: "/api/weread/book-read",
    params: [p("bookId", true, ""), p("chapterId", true, ""), p("progress", false, "0")],
    handler: async (ctx) => {
      const bookId = requireQuery(ctx.url, "bookId");
      const chapterId = requireQuery(ctx.url, "chapterId");
      const progress = Number(getQuery(ctx.url, "progress", "0"));
      const response = await ctx.fetchImpl("https://weread.qq.com/web/book/read", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ bookId, chapterId, progress }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 章节内容 E0-E3
  ...["e_0", "e_1", "e_2", "e_3"].map((suffix) =>
    endpoint({
      id: `weread-book-chapter-e${suffix.split("_")[1]}`,
      platformId: "weread",
      name: `book-chapter-e${suffix.split("_")[1]}`,
      method: "POST",
      path: `/api/weread/book-chapter-e${suffix.split("_")[1]}`,
      params: [p("bookId", true, ""), p("chapterId", true, "")],
      handler: async (ctx) => {
        const bookId = requireQuery(ctx.url, "bookId");
        const chapterId = requireQuery(ctx.url, "chapterId");
        const response = await ctx.fetchImpl(`https://weread.qq.com/web/book/chapter/${suffix}`, {
          method: "POST",
          headers: wereadHeaders(ctx.configStore),
          body: JSON.stringify({ bookId, chapterId }),
        });
        const data = await readUpstreamJson(response);
        return { ok: response.ok, status: response.status, data };
      },
    }),
  ),

  // 章节内容 T0-T1
  ...["t_0", "t_1"].map((suffix) =>
    endpoint({
      id: `weread-book-chapter-t${suffix.split("_")[1]}`,
      platformId: "weread",
      name: `章节内容T${suffix.split("_")[1]}`,
      method: "POST",
      path: `/api/weread/book-chapter-t${suffix.split("_")[1]}`,
      params: [p("bookId", true, ""), p("chapterId", true, "")],
      handler: async (ctx) => {
        const bookId = requireQuery(ctx.url, "bookId");
        const chapterId = requireQuery(ctx.url, "chapterId");
        const response = await ctx.fetchImpl(`https://weread.qq.com/web/book/chapter/${suffix}`, {
          method: "POST",
          headers: wereadHeaders(ctx.configStore),
          body: JSON.stringify({ bookId, chapterId }),
        });
        const data = await readUpstreamJson(response);
        return { ok: response.ok, status: response.status, data };
      },
    }),
  ),

  // 章节内容 E
  endpoint({
    id: "weread-book-chapter-e",
    platformId: "weread",
    name: "章节内容E",
    method: "POST",
    path: "/api/weread/book-chapter-e",
    params: [p("bookId", true, ""), p("chapterId", true, "")],
    handler: async (ctx) => {
      const bookId = requireQuery(ctx.url, "bookId");
      const chapterId = requireQuery(ctx.url, "chapterId");
      const response = await ctx.fetchImpl("https://weread.qq.com/web/book/chapter/e", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ bookId, chapterId }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 分类信息
  endpoint({
    id: "weread-category-info",
    platformId: "weread",
    name: "分类信息",
    method: "POST",
    path: "/api/weread/category-info",
    params: [p("categoryId", true, "")],
    handler: async (ctx) => {
      const categoryId = requireQuery(ctx.url, "categoryId");
      const response = await ctx.fetchImpl("https://weread.qq.com/web/book/category/info", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ categoryId }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 分类列表
  endpoint({
    id: "weread-category-list",
    platformId: "weread",
    name: "分类列表",
    method: "POST",
    path: "/api/weread/category-list",
    handler: async (ctx) => {
      const response = await ctx.fetchImpl("https://weread.qq.com/web/book/category/list", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({}),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // PDF URL
  endpoint({
    id: "weread-pdf-url",
    platformId: "weread",
    name: "PDF链接",
    method: "POST",
    path: "/api/weread/pdf-url",
    params: [p("bookId", true, "")],
    handler: async (ctx) => {
      const bookId = requireQuery(ctx.url, "bookId");
      const response = await ctx.fetchImpl("https://weread.qq.com/web/book/pdf", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ bookId }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // PDF转EPUB
  endpoint({
    id: "weread-pdf2epub",
    platformId: "weread",
    name: "PDF转EPUB",
    method: "POST",
    path: "/api/weread/pdf2epub",
    params: [p("bookId", true, "")],
    handler: async (ctx) => {
      const bookId = requireQuery(ctx.url, "bookId");
      const response = await ctx.fetchImpl("https://weread.qq.com/web/book/pdf2epub", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ bookId }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 我的书评
  endpoint({
    id: "weread-review-myself",
    platformId: "weread",
    name: "我的书评",
    method: "POST",
    path: "/api/weread/review-myself",
    params: [p("bookId", true, "")],
    handler: async (ctx) => {
      const bookId = requireQuery(ctx.url, "bookId");
      const response = await ctx.fetchImpl("https://weread.qq.com/web/review/myself", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ bookId }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 书评同步密钥
  endpoint({
    id: "weread-review-synckey",
    platformId: "weread",
    name: "书评同步密钥",
    method: "POST",
    path: "/api/weread/review-synckey",
    handler: async (ctx) => {
      const response = await ctx.fetchImpl("https://weread.qq.com/web/review/synckey", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({}),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 书评列表
  endpoint({
    id: "weread-review-list",
    platformId: "weread",
    name: "书评列表",
    method: "POST",
    path: "/api/weread/review-list",
    params: [p("bookId", true, ""), p("maxId", false, "0")],
    handler: async (ctx) => {
      const bookId = requireQuery(ctx.url, "bookId");
      const maxId = getQuery(ctx.url, "maxId", "0");
      const response = await ctx.fetchImpl("https://weread.qq.com/web/review/list", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ bookId, maxId }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 单条书评
  endpoint({
    id: "weread-review-single",
    platformId: "weread",
    name: "单条书评",
    method: "POST",
    path: "/api/weread/review-single",
    params: [p("reviewId", true, "")],
    handler: async (ctx) => {
      const reviewId = requireQuery(ctx.url, "reviewId");
      const response = await ctx.fetchImpl("https://weread.qq.com/web/review/single", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ reviewId }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 添加书评
  endpoint({
    id: "weread-review-add",
    platformId: "weread",
    name: "添加书评",
    method: "POST",
    path: "/api/weread/review-add",
    params: [p("bookId", true, ""), p("content", true, ""), p("rating", false, "0")],
    handler: async (ctx) => {
      const bookId = requireQuery(ctx.url, "bookId");
      const content = requireQuery(ctx.url, "content");
      const rating = Number(getQuery(ctx.url, "rating", "0"));
      const response = await ctx.fetchImpl("https://weread.qq.com/web/review/add", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ bookId, content, rating }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 上传完整书架
  endpoint({
    id: "weread-upload-shelf-full",
    platformId: "weread",
    name: "上传完整书架",
    method: "POST",
    path: "/api/weread/upload-shelf-full",
    params: [p("books", true, "[]")],
    handler: async (ctx) => {
      const books = JSON.parse(getQuery(ctx.url, "books", "[]"));
      const response = await ctx.fetchImpl("https://weread.qq.com/web/shelf/uploadFull", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ books }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 书架信息
  endpoint({
    id: "weread-shelf-info",
    platformId: "weread",
    name: "书架信息",
    method: "GET",
    path: "/api/weread/shelf-info",
    handler: async (ctx) => {
      const response = await ctx.fetchImpl("https://weread.qq.com/web/shelf/info", {
        method: "GET",
        headers: wereadHeaders(ctx.configStore),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 书架列表（带分页）
  endpoint({
    id: "weread-shelf-list",
    platformId: "weread",
    name: "书架列表",
    method: "GET",
    path: "/api/weread/shelf-list",
    params: [p("page", false, "1"), p("pageSize", false, "20")],
    handler: async (ctx) => {
      const page = getQuery(ctx.url, "page", "1");
      const pageSize = getQuery(ctx.url, "pageSize", "20");
      const response = await ctx.fetchImpl(`https://weread.qq.com/web/shelf/list?page=${page}&pageSize=${pageSize}`, {
        method: "GET",
        headers: wereadHeaders(ctx.configStore),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 从书架移除书籍
  endpoint({
    id: "weread-shelf-remove",
    platformId: "weread",
    name: "从书架移除",
    method: "POST",
    path: "/api/weread/shelf-remove",
    params: [p("bookIds", true, "")],
    handler: async (ctx) => {
      const bookIds = getQuery(ctx.url, "bookIds", "").split(",").filter(Boolean);
      const response = await ctx.fetchImpl("https://weread.qq.com/web/shelf/remove", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ bookIds }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 获取用户信息（当前登录用户）
  endpoint({
    id: "weread-user-info",
    platformId: "weread",
    name: "当前用户信息",
    method: "GET",
    path: "/api/weread/user-info",
    handler: async (ctx) => {
      const response = await ctx.fetchImpl("https://weread.qq.com/web/user/info", {
        method: "GET",
        headers: wereadHeaders(ctx.configStore),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 获取笔记列表
  endpoint({
    id: "weread-note-list",
    platformId: "weread",
    name: "笔记列表",
    method: "GET",
    path: "/api/weread/note-list",
    params: [p("bookId", true, ""), p("page", false, "1")],
    handler: async (ctx) => {
      const bookId = requireQuery(ctx.url, "bookId");
      const page = getQuery(ctx.url, "page", "1");
      const response = await ctx.fetchImpl(`https://weread.qq.com/web/note/list?bookId=${encodeURIComponent(bookId)}&page=${page}`, {
        method: "GET",
        headers: wereadHeaders(ctx.configStore),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // 添加笔记
  endpoint({
    id: "weread-note-add",
    platformId: "weread",
    name: "添加笔记",
    method: "POST",
    path: "/api/weread/note-add",
    params: [p("bookId", true, ""), p("chapterId", true, ""), p("content", true, ""), p("range", false, "")],
    handler: async (ctx) => {
      const bookId = requireQuery(ctx.url, "bookId");
      const chapterId = requireQuery(ctx.url, "chapterId");
      const content = requireQuery(ctx.url, "content");
      const range = getQuery(ctx.url, "range", "");
      const response = await ctx.fetchImpl("https://weread.qq.com/web/note/add", {
        method: "POST",
        headers: wereadHeaders(ctx.configStore),
        body: JSON.stringify({ bookId, chapterId, content, range }),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),
];

const wereadEndpoints = [...generatedEndpoints, ...additionalEndpoints];

module.exports = { wereadEndpoints };
