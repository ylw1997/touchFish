const { commonHeaders, fetchJson } = require("./upstream");
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
} = require("./newsParsers");
const {
  buildXCredential,
  buildXHeaders,
  getXTransactionId,
  getXhsSignature,
  getZhihuSignature,
} = require("./signers");
const {
  buildXiaoyuzhouHeaders,
  extractXiaoyuzhouAuth,
  getDeviceId,
  nowIsoWithTimezone,
} = require("./xiaoyuzhouCore");
const qqmusic = require("./qqmusicCore");

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

function p(name, required = false, example = "") {
  return { name, required, example };
}

function endpoint({ id, platformId, name, method = "GET", path, description = "", params = [], handler }) {
  return { id, platformId, name, method, path, description, params, handler };
}

function getQuery(url, name, fallback = "") {
  return url.searchParams.get(name) || fallback;
}

function requireQuery(url, name) {
  const value = url.searchParams.get(name);
  if (!value) {
    const error = new Error(`缺少参数: ${name}`);
    error.statusCode = 400;
    throw error;
  }
  return value;
}

function cookie(configStore, key) {
  return configStore.get(key) || "";
}

function userIdFromCookie(value) {
  return value.match(/DedeUserID=(\d+)/)?.[1] || "";
}

function _csrfFromCookie(value) {
  return value.match(/bili_jct=([^;]+)/)?.[1] || "";
}

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function xhsGetPath(apiPath, query) {
  const entries = Object.entries(query || {});
  if (!entries.length) return apiPath;
  return `${apiPath}?${entries
    .map(([key, value]) => `${key}=${value === undefined || value === null ? "" : String(value)}`)
    .join("&")}`;
}

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

function wereadHeaders(ctx) {
  return commonHeaders(cookie(ctx.configStore, "wereadCookie"), {
    referer: "https://weread.qq.com/",
    "content-type": "application/json",
  });
}

async function wereadRequest(ctx, target, { method = "GET", body } = {}) {
  return fetchJson(ctx.fetchImpl, target, {
    method,
    headers: wereadHeaders(ctx),
    body: body ? JSON.stringify(body) : undefined,
  });
}

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

function parsedJsonHandler(build, parse) {
  return async (ctx) => {
    const result = await jsonHandler(build)(ctx);
    return {
      ...result,
      data: parse(result.data, ctx),
    };
  };
}

function notPorted(reason) {
  return async () => ({
    ok: false,
    status: 501,
    data: {
      message: reason,
      next: "需要把原扩展里的签名、上传或浏览器态逻辑抽到 server core 后再启用。",
    },
  });
}

function qqmusicEndpoints() {
  const musicuEndpoint = ({ id, name, path, params = [], build, parse, method = "GET" }) =>
    endpoint({
      id,
      platformId: "qqmusic",
      name,
      method,
      path,
      params,
      handler: async (ctx) => {
        const result = await qqmusic.musicu(ctx, build(ctx));
        return { ...result, data: parse ? parse(result.data, ctx) : result.data };
      },
    });

  return [
    ...[
      ["qqmusic-search-songs", "search-songs", "/api/qqmusic/search", ({ url }) => `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?p=${getQuery(url, "page", "1")}&n=${getQuery(url, "num", "20")}&w=${encodeURIComponent(requireQuery(url, "keyword"))}`, [p("keyword", true, "周杰伦"), p("page", false, "1"), p("num", false, "20")]],
      ["qqmusic-search-singers", "search-singers", "/api/qqmusic/search-singers", ({ url }) => `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?p=${getQuery(url, "page", "1")}&n=${getQuery(url, "num", "20")}&w=${encodeURIComponent(requireQuery(url, "keyword"))}&type=singer`, [p("keyword", true, "周杰伦")]],
      ["qqmusic-lyric", "lyric", "/api/qqmusic/lyric", ({ url }) => `https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${requireQuery(url, "mid")}&format=json&nobase64=1`, [p("mid", true, "0039MnYb0qxYhV")]],
    ].map(([id, name, path, buildUrl, params]) =>
      endpoint({
        id,
        platformId: "qqmusic",
        name,
        path,
        params,
        handler: jsonHandler(({ url }) => ({ url: buildUrl({ url }), headers: commonHeaders("", { referer: "https://y.qq.com/" }) })),
      }),
    ),
    endpoint({
      id: "qqmusic-rank-lists",
      platformId: "qqmusic",
      name: "rank-lists",
      path: "/api/qqmusic/rank-lists",
      handler: async (ctx) => {
        const result = await qqmusic.musicu(ctx, {
          "music.musicToplist.Toplist.GetAll": {
            module: "music.musicToplist.Toplist",
            method: "GetAll",
            param: {},
          },
        });
        const groups = result.data?.["music.musicToplist.Toplist.GetAll"]?.data?.group || [];
        const topList = groups.flatMap((group) => group.toplist || []);
        return {
          ...result,
          data: {
            items: topList.map((item) => ({
              id: item.topId,
              topId: item.topId,
              title: item.title,
              subtitle: item.titleShare || item.titleDetail,
              picUrl: item.headPicUrl || item.frontPicUrl,
              update_key: item.update_key,
            })),
          },
        };
      },
    }),
    endpoint({
      id: "qqmusic-rank-detail",
      platformId: "qqmusic",
      name: "rank-detail",
      path: "/api/qqmusic/rank-detail",
      params: [p("topId", true, "62"), p("page", false, "1"), p("num", false, "30")],
      handler: async (ctx) => {
        const page = Number(getQuery(ctx.url, "page", "1")) || 1;
        const num = Number(getQuery(ctx.url, "num", "30")) || 30;
        const topId = Number(requireQuery(ctx.url, "topId"));
        const result = await qqmusic.musicu(ctx, {
          "music.musicToplist.Toplist.GetDetail": {
            module: "music.musicToplist.Toplist",
            method: "GetDetail",
            param: { topId, offset: num * (page - 1), num, withTags: false },
          },
        });
        const rawData = result.data?.["music.musicToplist.Toplist.GetDetail"]?.data || {};
        const resData = rawData.data || rawData;
        return {
          ...result,
          data: {
            rankInfo: {
              id: resData.topId || topId,
              topId: resData.topId || topId,
              title: resData.title || "unknown",
              subtitle: resData.titleShare || resData.titleDetail,
              picUrl: resData.headPicUrl || resData.frontPicUrl,
              update_key: resData.update_key,
            },
            songs: (rawData.songInfoList || resData.songInfoList || resData.song || []).map(qqmusic.song),
          },
        };
      },
    }),
    endpoint({
      id: "qqmusic-song-url",
      platformId: "qqmusic",
      name: "song-url",
      path: "/api/qqmusic/song-url",
      params: [p("mid", true, "0039MnYb0qxYhV"), p("quality", false, "128")],
      handler: async (ctx) => {
        const mid = requireQuery(ctx.url, "mid");
        const quality = Number(getQuery(ctx.url, "quality", "128"));
        const fileType = quality === 999 ? "F000" : quality === 320 ? "M800" : "M500";
        const extension = quality === 999 ? ".flac" : ".mp3";
        const filename = `${fileType}${mid}${mid}${extension}`;
        const result = await qqmusic.musicu(
          ctx,
          {
            "music.vkey.GetVkey.UrlGetVkey": {
              method: "UrlGetVkey",
              module: "music.vkey.GetVkey",
              param: { filename: [filename], guid: qqmusic.guid(), songmid: [mid], songtype: [0] },
            },
          },
          { comm: { ct: "19" } },
        );
        const urlInfo = result.data?.["music.vkey.GetVkey.UrlGetVkey"]?.data?.midurlinfo?.[0];
        return { ...result, data: { url: urlInfo?.purl ? `https://isure.stream.qqmusic.qq.com/${urlInfo.purl}` : "", raw: urlInfo || null } };
      },
    }),
    musicuEndpoint({
      id: "qqmusic-song-detail",
      name: "song-detail",
      path: "/api/qqmusic/song-detail",
      params: [p("mid", true, "0039MnYb0qxYhV")],
      build: (ctx) => ({
        "music.pf_song_detail_svr": {
          method: "get_song_detail_yqq",
          module: "music.pf_song_detail_svr",
          param: { song_mid: requireQuery(ctx.url, "mid") },
        },
      }),
      parse: (data) => qqmusic.song(data?.["music.pf_song_detail_svr"]?.data?.track_info || {}),
    }),
    musicuEndpoint({
      id: "qqmusic-recommend-playlists",
      name: "recommend-playlists",
      path: "/api/qqmusic/recommend-playlists",
      params: [p("num", false, "10")],
      build: (ctx) => ({
        "music.playlist.PlaylistSquare.GetRecommendFeed": {
          module: "music.playlist.PlaylistSquare",
          method: "GetRecommendFeed",
          param: { From: 0, Size: Number(getQuery(ctx.url, "num", "10")) || 10 },
        },
      }),
      parse: (data) => ({
        items: (data?.["music.playlist.PlaylistSquare.GetRecommendFeed"]?.data?.List || []).map((item) =>
          qqmusic.playlist(item.Playlist?.basic || {}),
        ),
      }),
    }),
    endpoint({
      id: "qqmusic-playlist-detail",
      platformId: "qqmusic",
      name: "playlist-detail",
      path: "/api/qqmusic/playlist-detail",
      params: [p("dissid", true, "1"), p("page", false, "1"), p("num", false, "30")],
      handler: async (ctx) => {
        const page = Number(getQuery(ctx.url, "page", "1")) || 1;
        const num = Number(getQuery(ctx.url, "num", "30")) || 30;
        const dissid = Number(requireQuery(ctx.url, "dissid"));
        const result = await qqmusic.musicu(ctx, {
          "music.srfDissInfo.DissInfo": {
            method: "CgiGetDiss",
            module: "music.srfDissInfo.DissInfo",
            param: { disstid: dissid, dirid: 0, tag: true, song_begin: (page - 1) * num, song_num: num, userinfo: true, orderlist: true, onlysonglist: false },
          },
        });
        const data = result.data?.["music.srfDissInfo.DissInfo"]?.data || {};
        return {
          ...result,
          data: {
            playlist: qqmusic.playlist({ id: data.dirinfo?.id || dissid, title: data.dirinfo?.title, picurl: data.dirinfo?.picurl, nick: data.dirinfo?.creator?.nick, songnum: data.total_song_num }),
            songs: (data.songlist || []).map(qqmusic.song),
          },
        };
      },
    }),
    endpoint({
      id: "qqmusic-user-info",
      platformId: "qqmusic",
      name: "user-info",
      path: "/api/qqmusic/user-info",
      handler: async (ctx) => {
        const credential = qqmusic.requireCredential(ctx);
        const result = await qqmusic.musicu(ctx, {
          "music.UserInfo.userInfoServer": {
            method: "GetLoginUserInfo",
            module: "music.UserInfo.userInfoServer",
            param: {},
          },
        });
        const info = result.data?.["music.UserInfo.userInfoServer"]?.data?.info || {};
        return { ...result, data: { musicid: credential.musicid, nickname: info.nick || "", avatar: info.logo || "" } };
      },
    }),
    endpoint({
      id: "qqmusic-my-favorite",
      platformId: "qqmusic",
      name: "my-favorite",
      path: "/api/qqmusic/my-favorite",
      params: [p("page", false, "1"), p("num", false, "30")],
      handler: async (ctx) => {
        const credential = qqmusic.requireCredential(ctx);
        const page = Number(getQuery(ctx.url, "page", "1")) || 1;
        const num = Number(getQuery(ctx.url, "num", "30")) || 30;
        const euin = await qqmusic.getEuin(ctx, credential.musicid);
        const result = await qqmusic.musicu(ctx, {
          "music.srfDissInfo.DissInfo": {
            method: "CgiGetDiss",
            module: "music.srfDissInfo.DissInfo",
            param: { disstid: 0, dirid: 201, tag: true, song_begin: (page - 1) * num, song_num: num, userinfo: true, orderlist: true, enc_host_uin: euin },
          },
        });
        const data = result.data?.["music.srfDissInfo.DissInfo"]?.data || {};
        return { ...result, data: { songs: (data.songlist || []).map(qqmusic.song), total: data.total_song_num || 0 } };
      },
    }),
    endpoint({
      id: "qqmusic-my-playlists",
      platformId: "qqmusic",
      name: "my-playlists",
      path: "/api/qqmusic/my-playlists",
      handler: async (ctx) => {
        const credential = qqmusic.requireCredential(ctx);
        const result = await qqmusic.musicu(ctx, {
          "music.musicasset.PlaylistBaseRead": {
            method: "GetPlaylistByUin",
            module: "music.musicasset.PlaylistBaseRead",
            param: { uin: credential.musicid },
          },
        });
        return { ...result, data: { items: (result.data?.["music.musicasset.PlaylistBaseRead"]?.data?.v_playlist || []).map(qqmusic.playlist) } };
      },
    }),
    musicuEndpoint({
      id: "qqmusic-radar-recommend",
      name: "radar-recommend",
      path: "/api/qqmusic/radar-recommend",
      build: () => ({
        "music.recommend.TrackRelationServer": {
          method: "GetRadarSong",
          module: "music.recommend.TrackRelationServer",
          param: { Page: 1, ReqType: 0, FavSongs: [], EntranceSongs: [] },
        },
      }),
      parse: (data) => data?.["music.recommend.TrackRelationServer"]?.data || null,
    }),
    musicuEndpoint({
      id: "qqmusic-guess-recommend",
      name: "guess-recommend",
      path: "/api/qqmusic/guess-recommend",
      build: () => ({
        "music.radioProxy.MbTrackRadioSvr": {
          method: "get_radio_track",
          module: "music.radioProxy.MbTrackRadioSvr",
          param: { id: 99, num: 5, from: 0, scene: 0, song_ids: [], ext: { bluetooth: "" }, should_count_down: 1 },
        },
      }),
      parse: (data) => data?.["music.radioProxy.MbTrackRadioSvr"]?.data || null,
    }),
    musicuEndpoint({
      id: "qqmusic-singer-info",
      name: "singer-info",
      path: "/api/qqmusic/singer-info",
      params: [p("mid", true, "0025NhlN2yWrP4")],
      build: (ctx) => ({
        "music.UnifiedHomepage.UnifiedHomepageSrv": {
          method: "GetHomepageHeader",
          module: "music.UnifiedHomepage.UnifiedHomepageSrv",
          param: { SingerMid: requireQuery(ctx.url, "mid") },
        },
      }),
      parse: (data) => data?.["music.UnifiedHomepage.UnifiedHomepageSrv"]?.data || {},
    }),
    musicuEndpoint({
      id: "qqmusic-singer-songs",
      name: "singer-songs",
      path: "/api/qqmusic/singer-songs",
      params: [p("mid", true, "0025NhlN2yWrP4"), p("page", false, "1"), p("num", false, "20")],
      build: (ctx) => {
        const page = Number(getQuery(ctx.url, "page", "1")) || 1;
        const num = Number(getQuery(ctx.url, "num", "20")) || 20;
        return {
          "musichall.song_list_server": {
            method: "GetSingerSongList",
            module: "musichall.song_list_server",
            param: { singerMid: requireQuery(ctx.url, "mid"), order: 1, number: num, begin: (page - 1) * num },
          },
        };
      },
      parse: (data) => ({ items: (data?.["musichall.song_list_server"]?.data?.songList || []).map((item) => qqmusic.song(item.songInfo || item)) }),
    }),
    ...[
      ["add-songs", "AddSonglist"],
      ["remove-songs", "DelSonglist"],
    ].map(([route, method]) =>
      endpoint({
        id: `qqmusic-${route}`,
        platformId: "qqmusic",
        name: route,
        method: "POST",
        path: `/api/qqmusic/${route}`,
        params: [p("payload", false, "{\"dirid\":201,\"songIds\":[1]}")],
        handler: async (ctx) => {
          qqmusic.requireCredential(ctx);
          const payload = parseJson(ctx.body || "{}");
          const result = await qqmusic.musicu(ctx, {
            "music.musicasset.PlaylistDetailWrite": {
              method,
              module: "music.musicasset.PlaylistDetailWrite",
              param: {
                dirId: Number(payload.dirid || payload.dirId || 201),
                v_songInfo: (payload.songIds || []).map((id) => ({ songType: 0, songId: Number(id) })),
              },
            },
          });
          const data = result.data?.["music.musicasset.PlaylistDetailWrite"]?.data || {};
          return { ...result, data: { ok: !!data.result?.updateTime, raw: data } };
        },
      }),
    ),
    ...[
      ["qq-login-qr", "QQ login QR needs browser session storage."],
      ["wx-login-qr", "WX login QR needs browser session storage."],
      ["check-login", "Login polling needs browser session storage."],
    ].map(([route, reason]) =>
      endpoint({ id: `qqmusic-${route}`, platformId: "qqmusic", name: route, path: `/api/qqmusic/${route}`, handler: notPorted(reason) }),
    ),
  ];
}

const endpointNameOverrides = {
  "chiphell-list": "列表",
  "chiphell-detail": "详情",
  "v2ex-list": "列表",
  "v2ex-detail": "详情",
  "hupu-list": "列表",
  "hupu-detail": "详情",
  "nga-list": "列表",
  "nga-detail": "详情",
  "linuxdo-list": "列表",
  "linuxdo-detail": "详情",
  "zhihu-hot": "热榜",
  "zhihu-question-page": "问题页面",
  "zhihu-recommend-live": "推荐流",
  "zhihu-follow-live": "关注流",
  "zhihu-comments-live": "回答评论",
  "zhihu-child-comments-live": "子评论",
  "zhihu-question-feeds-live": "问题回答",
  "zhihu-search-live": "搜索",
  "zhihu-hot-questions-live": "热门问题",
  "zhihu-recommend": "推荐流",
  "zhihu-follow": "关注流",
  "zhihu-question-feeds": "问题回答",
  "zhihu-comments": "回答评论",
  "zhihu-child-comments": "子评论",
  "zhihu-search": "搜索",
  "zhihu-vote": "回答投票",
  "zhihu-follow-question": "关注问题",
  "zhihu-unfollow-question": "取消关注问题",
  "zhihu-hot-questions": "热门问题",
  "zhihu-read-items": "上报已读",
  "weibo-feed": "feed",
  "weibo-comment": "评论",
  "weibo-longtext": "长微博",
  "weibo-user": "用户微博",
  "weibo-user-by-name": "用户搜索",
  "weibo-hot-search": "热搜",
  "weibo-search": "微博搜索",
  "weibo-follow": "关注用户",
  "weibo-unfollow": "取消关注",
  "weibo-like": "点赞",
  "weibo-unlike": "取消点赞",
  "weibo-send": "发微博",
  "weibo-repost": "转发",
  "weibo-create-comment": "发表评论",
  "weibo-upload-image": "上传图片",
  "weibo-download-video": "下载视频",
  "bilibili-qrcode": "登录二维码",
  "bilibili-qrcode-poll": "轮询登录",
  "bilibili-nav": "登录用户",
  "bilibili-popular": "热门视频",
  "bilibili-live-list": "直播列表",
  "bilibili-followed-live": "关注直播",
  "bilibili-live-playurl": "直播流",
  "bilibili-recommend": "推荐视频",
  "bilibili-dynamic": "动态",
  "bilibili-watch-later": "稍后再看",
  "bilibili-favorites": "收藏夹",
  "bilibili-favorite-detail": "收藏详情",
  "bilibili-playurl": "播放地址",
  "bilibili-video-info": "视频详情",
  "bilibili-danmaku": "弹幕 XML",
  "bilibili-search": "搜索",
  "bilibili-user-videos": "用户视频",
  "bilibili-user-card": "用户卡片",
  "bilibili-add-watch-later": "加入稍后再看",
  "bilibili-del-watch-later": "移除稍后再看",
  "bilibili-modify-relation": "关注/取关",
};

Object.assign(endpointNameOverrides, {
  "xiaoyuzhou-refresh-token": "\u5237\u65b0 token",
  "xiaoyuzhou-discovery-feed": "\u53d1\u73b0\u6d41",
  "xiaoyuzhou-inbox": "\u6536\u4ef6\u7bb1",
  "xiaoyuzhou-pilot-discovery": "\u7f16\u8f91\u7cbe\u9009",
  "xiaoyuzhou-top-list": "\u699c\u5355",
  "xiaoyuzhou-search": "\u641c\u7d22\u64ad\u5ba2",
  "xiaoyuzhou-podcast-detail": "\u64ad\u5ba2\u8be6\u60c5",
  "xiaoyuzhou-episode-list": "\u5355\u96c6\u5217\u8868",
  "xiaoyuzhou-episode-detail": "\u5355\u96c6\u8be6\u60c5",
  "xiaoyuzhou-episode-transcript": "\u5355\u96c6\u8f6c\u5f55",
  "xiaoyuzhou-subscriptions": "\u8ba2\u9605\u5217\u8868",
  "xiaoyuzhou-update-subscription": "\u66f4\u65b0\u8ba2\u9605",
  "xiaoyuzhou-send-sms": "\u53d1\u9001\u9a8c\u8bc1\u7801",
  "xiaoyuzhou-login-sms": "\u77ed\u4fe1\u767b\u5f55",
  // QQ音乐
  "qqmusic-search-songs": "搜索歌曲",
  "qqmusic-search-singers": "搜索歌手",
  "qqmusic-lyric": "歌词",
  "qqmusic-rank-lists": "榜单列表",
  "qqmusic-rank-detail": "榜单详情",
  "qqmusic-song-url": "歌曲链接",
  "qqmusic-song-detail": "歌曲详情",
  "qqmusic-recommend-playlists": "推荐歌单",
  "qqmusic-playlist-detail": "歌单详情",
  "qqmusic-user-info": "用户信息",
  "qqmusic-my-favorite": "我的收藏",
  "qqmusic-my-playlists": "我的歌单",
  "qqmusic-radar-recommend": "雷达推荐",
  "qqmusic-playlist-create": "创建歌单",
  "qqmusic-playlist-delete": "删除歌单",
  "qqmusic-playlist-add-songs": "添加歌曲",
  "qqmusic-playlist-del-songs": "删除歌曲",
  "qqmusic-qq-login-qr": "QQ登录二维码",
  "qqmusic-wx-login-qr": "微信登录二维码",
  "qqmusic-check-login": "检查登录状态",
  // 小红书
  "xhs-feed": "推荐流",
  "xhs-detail": "笔记详情",
  "xhs-comments": "评论列表",
  "xhs-sub-comments": "子评论",
  "xhs-search": "搜索",
  "xhs-me": "我的信息",
  "xhs-user-posted": "用户发布",
  "xhs-hover-card": "用户卡片",
  "xhs-follow": "关注用户",
  "xhs-unfollow": "取消关注",
  "xhs-like": "点赞",
  "xhs-dislike": "取消点赞",
  "xhs-collect": "收藏",
  "xhs-uncollect": "取消收藏",
  "xhs-post-comment": "发表评论",
  "xhs-upload-permit": "上传许可",
  "xhs-upload-image": "上传图片",
  "xhs-publish-note": "发布笔记",
  // X平台
  "x-home-latest": "最新时间线",
  "x-search": "搜索",
  "x-user-info": "用户信息",
  "x-tweet-detail": "推文详情",
  "x-user-tweets": "用户推文",
  "x-following": "关注列表",
  "x-home-latest-next": "最新时间线(下一页)",
  "x-home": "主页时间线",
  "x-home-next": "主页时间线(下一页)",
  "x-home-refresh": "刷新主页",
  "x-follow": "关注用户",
  "x-unfollow": "取消关注",
  "x-translate": "翻译推文",
  "x-create-tweet": "发推文",
  "x-repost": "转发推文",
  "x-upload-media": "上传媒体",
  "x-verify-credentials": "验证凭证",
  "x-favorite": "收藏推文",
  "x-unfavorite": "取消收藏",
  // 微信读书
  "weread-login-getuid": "获取UID",
  "weread-login-getinfo": "获取登录信息",
  "weread-login-notify": "登录通知",
  "weread-shelf-sync": "同步书架",
  "weread-shelf-sync-book": "同步书籍",
  "weread-shelf-book-ids": "书架书籍ID",
  "weread-shelf-add-to-shelf": "加入书架",
  "weread-shelf-add": "添加书架",
  "weread-book-info": "书籍信息",
  "weread-book-publicinfos": "书籍公开信息",
  "weread-book-search": "搜索书籍",
  "weread-book-chapter-infos": "章节信息",
  "weread-book-progress": "阅读进度",
  "weread-book-bookmarklist": "书签列表",
  "weread-book-read-reviews": "书评列表",
  "weread-book-underlines": "划线笔记",
  "weread-categories": "分类列表",
  "weread-recommend-books": "推荐书籍",
  "weread-config": "配置信息",
  "weread-pay-balance": "账户余额",
  "weread-pay-member-card-summary": "会员卡信息",
  "weread-user": "用户信息",
  "weread-login-confirm": "确认登录",
  "weread-login-weblogin": "网页登录",
  "weread-login-session-init": "初始化会话",
  "weread-login-renewal": "续期登录",
  "weread-book-read-init": "初始化阅读",
  "weread-book-read": "阅读书籍",
  "weread-book-chapter-e0": "章节内容E0",
  "weread-book-chapter-e1": "章节内容E1",
  "weread-book-chapter-e2": "章节内容E2",
  "weread-book-chapter-e3": "章节内容E3",
  "weread-book-chapter-t0": "章节内容T0",
  "weread-book-chapter-t1": "章节内容T1",
  "weread-book-chapter-e": "章节内容",
  "weread-category-info": "分类信息",
  "weread-category-list": "分类列表",
  "weread-pdf-url": "PDF链接",
  "weread-pdf2epub": "PDF转EPUB",
  "weread-review-myself": "我的书评",
  "weread-review-synckey": "书评同步密钥",
  "weread-review-list": "书评列表",
  "weread-review-single": "单条书评",
  "weread-review-add": "添加书评",
  "weread-upload-shelf-full": "上传完整书架",
});

function normalizeEndpointName(item) {
  return endpointNameOverrides[item.id] ? { ...item, name: endpointNameOverrides[item.id] } : item;
}

const endpoints = [
  endpoint({ id: "health", platformId: "system", name: "服务状态", path: "/health", description: "检查本地服务是否可用。", handler: async () => ({ ok: true, status: 200, data: { service: "touchfish-server", mode: "local" } }) }),
  endpoint({ id: "catalog", platformId: "system", name: "接口目录", path: "/api/catalog", description: "返回验证台平台和接口列表。", handler: async () => ({ ok: true, status: 200, data: { platforms, endpoints: listEndpoints() } }) }),
  endpoint({ id: "config-list", platformId: "system", name: "配置列表", path: "/api/config", description: "查看脱敏后的本地配置。", handler: async (ctx) => ({ ok: true, status: 200, data: ctx.configStore.all() }) }),

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
  endpoint({
    id: "zhihu-recommend-live",
    platformId: "zhihu",
    name: "推荐流",
    path: "/api/zhihu/recommend",
    params: [p("nextUrl", false, "")],
    handler: (ctx) => zhihuSignedGet(ctx, getQuery(ctx.url, "nextUrl", "/api/v3/feed/topstory/recommend?limit=10&desktop=true")),
  }),
  endpoint({
    id: "zhihu-follow-live",
    platformId: "zhihu",
    name: "关注流",
    path: "/api/zhihu/follow",
    params: [p("nextUrl", false, "")],
    handler: (ctx) => zhihuSignedGet(ctx, getQuery(ctx.url, "nextUrl", "/api/v3/moments?limit=10&desktop=true")),
  }),
  endpoint({
    id: "zhihu-comments-live",
    platformId: "zhihu",
    name: "回答评论",
    path: "/api/zhihu/comments",
    params: [p("answerId", true, "1")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, `/api/v4/comment_v5/answers/${requireQuery(ctx.url, "answerId")}/root_comment?order_by=score&limit=100&offset=`),
  }),
  endpoint({
    id: "zhihu-child-comments-live",
    platformId: "zhihu",
    name: "子评论",
    path: "/api/zhihu/child-comments",
    params: [p("commentId", true, "1")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, `/api/v4/comment_v5/comment/${requireQuery(ctx.url, "commentId")}/child_comment?order_by=ts&limit=20&offset=`),
  }),
  endpoint({
    id: "zhihu-question-feeds-live",
    platformId: "zhihu",
    name: "问题回答",
    path: "/api/zhihu/question-feeds",
    params: [p("questionId", true, "1932357580283437907"), p("order", false, "default")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, `/api/v4/questions/${requireQuery(ctx.url, "questionId")}/feeds?include=data[*].content&limit=30&offset=0&order=${getQuery(ctx.url, "order", "default")}&platform=desktop&ws_qiangzhisafe=0`),
  }),
  endpoint({
    id: "zhihu-search-live",
    platformId: "zhihu",
    name: "搜索",
    path: "/api/zhihu/search",
    params: [p("query", true, "OpenAI")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, `/api/v4/search_v3?t=general&q=${encodeURIComponent(requireQuery(ctx.url, "query"))}&gk_version=gz-gaokao&correction=1&offset=0&limit=20&filter_fields=&lc_idx=0&show_all_topics=0&search_source=Normal`),
  }),
  endpoint({
    id: "zhihu-hot-questions-live",
    platformId: "zhihu",
    name: "热门问题",
    path: "/api/zhihu/hot-questions",
    params: [p("nextUrl", false, "")],
    handler: (ctx) =>
      zhihuSignedGet(ctx, getQuery(ctx.url, "nextUrl", "/api/v4/creators/question_route/pc_member_related/hot?page_source=pc_panel&limit=20&offset=0&recom_domain_score_ab=1")),
  }),
  ...[
    ["zhihu-recommend", "推荐流", "/api/zhihu/recommend"],
    ["zhihu-follow", "关注流", "/api/zhihu/follow"],
    ["zhihu-question-feeds", "问题回答", "/api/zhihu/question-feeds"],
    ["zhihu-comments", "回答评论", "/api/zhihu/comments"],
    ["zhihu-child-comments", "子评论", "/api/zhihu/child-comments"],
    ["zhihu-search", "搜索", "/api/zhihu/search"],
    ["zhihu-vote", "回答投票", "/api/zhihu/vote"],
    ["zhihu-follow-question", "关注问题", "/api/zhihu/follow-question"],
    ["zhihu-unfollow-question", "鍙栨秷关注问题", "/api/zhihu/unfollow-question"],
    ["zhihu-hot-questions", "热门问题", "/api/zhihu/hot-questions"],
    ["zhihu-read-items", "上报已读", "/api/zhihu/read-items"],
  ].map(([id, name, path]) =>
    endpoint({ id, platformId: "zhihu", name, path, params: [p("payload", false, "{}")], handler: notPorted("知乎该接口需要 x-zse-96 签名。") }),
  ),

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
  ...[
    ["weibo-comment", "评论", "/api/weibo/comment", ({ url }) => `https://weibo.com/ajax${requireQuery(url, "path")}`, [p("path", true, "/comments/hotflow?id=1")]],
    ["weibo-longtext", "longtext", "/api/weibo/longtext", ({ url }) => `https://weibo.com/ajax/statuses/longtext?id=${requireQuery(url, "id")}`, [p("id", true, "1")]],
    ["weibo-user", "用户微博", "/api/weibo/user", ({ url }) => `https://weibo.com/ajax/statuses/mymblog?uid=${requireQuery(url, "uid")}&page=${getQuery(url, "page", "1")}&feature=0`, [p("uid", true, "1"), p("page", false, "1")]],
    ["weibo-user-by-name", "用户搜索", "/api/weibo/user-by-name", ({ url }) => `https://weibo.com/ajax/profile/info?screen_name=${encodeURIComponent(requireQuery(url, "name"))}`, [p("name", true, "人民日报")]],
    ["weibo-hot-search", "热搜", "/api/weibo/hot-search", () => "https://weibo.com/ajax/side/hotSearch", []],
    ["weibo-search", "寰崥搜索", "/api/weibo/search", ({ url }) => `https://s.weibo.com/weibo?q=${encodeURIComponent(requireQuery(url, "keyword"))}`, [p("keyword", true, "TouchFish")]],
  ].map(([id, name, path, buildUrl, params]) =>
    endpoint({
      id,
      platformId: "weibo",
      name,
      path,
      params,
      handler: jsonHandler(({ url, configStore }) => {
        const ck = cookie(configStore, "weiboCookie");
        return { url: buildUrl({ url }), headers: commonHeaders(ck, { referer: "https://weibo.com/" }) };
      }),
    }),
  ),
  ...[
    ["weibo-follow", "关注用户"],
    ["weibo-unfollow", "取消关注"],
    ["weibo-like", "点赞"],
    ["weibo-unlike", "鍙栨秷点赞"],
    ["weibo-send", "send"],
    ["weibo-repost", "转发"],
    ["weibo-create-comment", "鍙戣〃评论"],
    ["weibo-upload-image", "上传图片"],
    ["weibo-download-video", "下载视频"],
  ].map(([id, name]) => endpoint({ id, platformId: "weibo", name, method: "POST", path: `/api/weibo/${id.replace("weibo-", "")}`, handler: notPorted("微博写操作/下载需要本地文件和 CSRF 适配。") })),

  ...[
    ["bilibili-qrcode", "qrcode", "/api/bilibili/qrcode", () => "https://passport.bilibili.com/x/passport-login/web/qrcode/generate", []],
    ["bilibili-qrcode-poll", "轮询登录", "/api/bilibili/qrcode/poll", ({ url }) => `https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${requireQuery(url, "qrcode_key")}`, [p("qrcode_key", true, "")]],
    ["bilibili-nav", "登录用户", "/api/bilibili/nav", () => "https://api.bilibili.com/x/web-interface/nav", []],
    ["bilibili-popular", "热门视频", "/api/bilibili/popular", ({ url }) => `https://api.bilibili.com/x/web-interface/popular?pn=${getQuery(url, "pn", "1")}&ps=${getQuery(url, "ps", "20")}`, [p("pn", false, "1"), p("ps", false, "20")]],
    ["bilibili-live-list", "直播列表", "/api/bilibili/live-list", ({ url }) => `https://api.live.bilibili.com/room/v3/area/getRoomList?page=${getQuery(url, "page", "1")}&page_size=20&sort_type=online`, [p("page", false, "1")]],
    ["bilibili-followed-live", "关注直播", "/api/bilibili/followed-live", ({ url }) => `https://api.live.bilibili.com/xlive/web-ucenter/v1/xfetter/FeedList?page=${getQuery(url, "page", "1")}&page_size=${getQuery(url, "pageSize", "50")}&platform=web`, [p("page", false, "1"), p("pageSize", false, "50")]],
    ["bilibili-live-playurl", "live-playurl", "/api/bilibili/live-playurl", ({ url }) => `https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id=${requireQuery(url, "roomId")}&protocol=0,1&format=0,1,2&codec=0&qn=${getQuery(url, "qn", "10000")}&platform=android`, [p("roomId", true, "1"), p("qn", false, "10000")]],
    ["bilibili-recommend", "推荐视频", "/api/bilibili/recommend", () => "https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd?web_location=1430650&y_num=5&fresh_type=3&feed_version=V8&homepage_ver=1&ps=10&last_y_num=5&screen=2010-595", []],
    ["bilibili-dynamic", "dynamic", "/api/bilibili/dynamic", ({ url }) => `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/all?type=video&platform=web&page=${getQuery(url, "page", "1")}${url.searchParams.get("offset") ? `&timezone_offset=-480&offset=${url.searchParams.get("offset")}` : ""}`, [p("page", false, "1"), p("offset", false, "")]],
    ["bilibili-watch-later", "稍后再看", "/api/bilibili/watch-later", ({ url }) => `https://api.bilibili.com/x/v2/history/toview/web?pn=${getQuery(url, "page", "1")}&ps=${getQuery(url, "pageSize", "20")}`, [p("page", false, "1"), p("pageSize", false, "20")]],
    ["bilibili-favorites", "favorites", "/api/bilibili/favorites", ({ configStore }) => `https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${userIdFromCookie(cookie(configStore, "bilibiliCookie"))}`, []],
    ["bilibili-favorite-detail", "收藏详情", "/api/bilibili/favorite-detail", ({ url }) => `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${requireQuery(url, "mediaId")}&pn=${getQuery(url, "page", "1")}&ps=${getQuery(url, "pageSize", "20")}`, [p("mediaId", true, "1"), p("page", false, "1"), p("pageSize", false, "20")]],
    ["bilibili-playurl", "播放地址", "/api/bilibili/playurl", ({ url }) => `https://api.bilibili.com/x/player/wbi/playurl?bvid=${requireQuery(url, "bvid")}&cid=${requireQuery(url, "cid")}&qn=112&platform=html5&high_quality=1`, [p("bvid", true, "BV1xx411c7mD"), p("cid", true, "1")]],
    ["bilibili-video-info", "视频详情", "/api/bilibili/video-info", ({ url }) => `https://api.bilibili.com/x/web-interface/view?bvid=${requireQuery(url, "bvid")}`, [p("bvid", true, "BV1xx411c7mD")]],
    ["bilibili-danmaku", "弹幕 XML", "/api/bilibili/danmaku", ({ url }) => `https://api.bilibili.com/x/v1/dm/list.so?oid=${requireQuery(url, "cid")}`, [p("cid", true, "1")]],
    ["bilibili-search", "搜索", "/api/bilibili/search", ({ url }) => `https://api.bilibili.com/x/web-interface/wbi/search/all/v2?keyword=${encodeURIComponent(requireQuery(url, "keyword"))}&page=${getQuery(url, "page", "1")}`, [p("keyword", true, "音乐"), p("page", false, "1")]],
    ["bilibili-user-videos", "用户视频", "/api/bilibili/user-videos", ({ url }) => `https://api.bilibili.com/x/series/recArchivesByKeywords?mid=${requireQuery(url, "mid")}&keywords=&pn=${getQuery(url, "page", "1")}`, [p("mid", true, "2"), p("page", false, "1")]],
    ["bilibili-user-card", "用户卡片", "/api/bilibili/user-card", ({ url }) => `https://api.bilibili.com/x/web-interface/card?mid=${requireQuery(url, "mid")}`, [p("mid", true, "2")]],
  ].map(([id, name, path, buildUrl, params]) =>
    endpoint({
      id,
      platformId: "bilibili",
      name,
      path,
      params,
      handler: jsonHandler(({ url, configStore }) => ({
        url: buildUrl({ url, configStore }),
        headers: commonHeaders(cookie(configStore, "bilibiliCookie"), { referer: "https://www.bilibili.com/", origin: "https://www.bilibili.com" }),
      })),
    }),
  ),
  ...[
    ["bilibili-add-watch-later", "加入稍后再看", "add-watch-later"],
    ["bilibili-del-watch-later", "移除稍后再看", "del-watch-later"],
    ["bilibili-modify-relation", "关注/取关", "modify-relation"],
  ].map(([id, name, route]) => endpoint({ id, platformId: "bilibili", name, method: "POST", path: `/api/bilibili/${route}`, handler: notPorted("B站写操作需要从 Cookie 提取 CSRF 并提交表单。") })),

  ...qqmusicEndpoints(),

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
  ...[
    ["discovery-feed", "discovery-feed", "POST", "https://api.xiaoyuzhoufm.com/v1/discovery-feed/list", () => ({ returnAll: "false" })],
    ["inbox", "inbox", "POST", "https://api.xiaoyuzhoufm.com/v1/inbox/list", () => ({ limit: "20" })],
    ["pilot-discovery", "pilot-discovery", "POST", "https://api.xiaoyuzhoufm.com/v1/pilot-discovery/list", () => ({})],
    ["top-list", "榜单", "GET", "https://api.xiaoyuzhoufm.com/v1/top-list/get?category=HOT_EPISODES_IN_24_HOURS"],
    ["search", "搜索播客", "POST", "https://api.xiaoyuzhoufm.com/v1/search/create", (ctx) => ({ keyword: requireQuery(ctx.url, "keyword"), type: "PODCAST" }), [p("keyword", true, "科技")]],
    ["podcast-detail", "播客详情", "GET", (ctx) => `https://api.xiaoyuzhoufm.com/v1/podcast/get?pid=${requireQuery(ctx.url, "pid")}`, null, [p("pid", true, "")]],
    ["episode-list", "单集列表", "POST", "https://api.xiaoyuzhoufm.com/v1/episode/list", (ctx) => ({ pid: requireQuery(ctx.url, "pid"), order: getQuery(ctx.url, "order", "desc") }), [p("pid", true, ""), p("order", false, "desc")]],
    ["episode-detail", "单集详情", "GET", (ctx) => `https://api.xiaoyuzhoufm.com/v1/episode/get?eid=${requireQuery(ctx.url, "eid")}`, null, [p("eid", true, "")]],
    ["episode-transcript", "单集转录", "POST", "https://api.xiaoyuzhoufm.com/v1/episode-transcript/get", (ctx) => ({ eid: requireQuery(ctx.url, "eid"), mediaId: requireQuery(ctx.url, "mediaId") }), [p("eid", true, ""), p("mediaId", true, "")]],
    ["subscriptions", "璁㈤槄列表", "POST", "https://api.xiaoyuzhoufm.com/v1/subscription/list", () => ({ limit: "20", sortOrder: "desc", sortBy: "subscribedAt" })],
    ["update-subscription", "更新订阅", "POST", "https://api.xiaoyuzhoufm.com/v1/subscription/update", (ctx) => ({ pid: requireQuery(ctx.url, "pid"), mode: getQuery(ctx.url, "mode", "ON") }), [p("pid", true, ""), p("mode", false, "ON")]],
  ].map(([route, name, method, target, buildBody, params = []]) =>
    endpoint({
      id: `xiaoyuzhou-${route}`,
      platformId: "xiaoyuzhou",
      name,
      path: `/api/xiaoyuzhou/${route}`,
      params,
      handler: (ctx) =>
        xiaoyuzhouRequest(ctx, typeof target === "function" ? target(ctx) : target, {
          method,
          contentType: method === "POST" ? "application/json" : undefined,
          body: buildBody ? buildBody(ctx) : undefined,
        }),
    }),
  ),
  ...[
    ["send-sms", "发送验证码"],
    ["login-sms", "短信登录"],
  ].map(([route, name]) => endpoint({ id: `xiaoyuzhou-${route}`, platformId: "xiaoyuzhou", name, method: "POST", path: `/api/xiaoyuzhou/${route}`, params: [p("payload", false, "{}")], handler: notPorted("小宇宙短信登录需要单独做登录页确认风控。") })),

  ...[
    ["login-getuid", "POST", "https://weread.qq.com/web/login/getuid"],
    ["login-getinfo", "POST", (_ctx) => "https://weread.qq.com/web/login/getinfo", (ctx) => ({ uid: requireQuery(ctx.url, "uid") }), [p("uid", true, "")]],
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
  ].map(([route, method, target, buildBody, params = []]) =>
    endpoint({
      id: `weread-${route}`,
      platformId: "weread",
      name: route,
      path: `/api/weread/${route}`,
      params,
      handler: (ctx) =>
        wereadRequest(ctx, typeof target === "function" ? target(ctx) : target, {
          method,
          body: buildBody ? buildBody(ctx) : undefined,
        }),
    }),
  ),
  ...[
    "login-confirm", "login-weblogin", "login-session-init", "login-renewal",
    "book-read-init", "book-read", "book-chapter-e0", "book-chapter-e1", "book-chapter-e2", "book-chapter-e3", "book-chapter-t0", "book-chapter-t1", "book-chapter-e",
    "category-info", "category-list", "pdf-url", "pdf2epub", "review-myself", "review-synckey", "review-list", "review-single", "review-add", "upload-shelf-full",
  ].map((route) => endpoint({ id: `weread-${route}`, platformId: "weread", name: route, path: `/api/weread/${route}`, params: [p("payload", false, "{}")], handler: notPorted("微信读书接口涉及阅读签名、章节解密或登录续期。") })),

  endpoint({
    id: "xhs-feed",
    platformId: "xhs",
    name: "feed",
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
  endpoint({
    id: "xhs-detail",
    platformId: "xhs",
    name: "detail",
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
  endpoint({
    id: "xhs-comments",
    platformId: "xhs",
    name: "comments",
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
  endpoint({
    id: "xhs-sub-comments",
    platformId: "xhs",
    name: "sub-comments",
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
          top_comment_id: "",
          xsec_token: requireQuery(ctx.url, "xsec_token"),
        },
      }),
  }),
  endpoint({
    id: "xhs-search",
    platformId: "xhs",
    name: "search",
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
  endpoint({
    id: "xhs-me",
    platformId: "xhs",
    name: "me",
    path: "/api/xhs/me",
    handler: (ctx) => xhsRequest(ctx, "/api/sns/web/v2/user/me", { method: "GET" }),
  }),
  endpoint({
    id: "xhs-user-posted",
    platformId: "xhs",
    name: "user-posted",
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
  ...[
    ["hover-card", "/api/sns/web/v1/user/hover_card"],
    ["follow", "/api/sns/web/v1/user/follow"],
    ["unfollow", "/api/sns/web/v1/user/unfollow"],
    ["like", "/api/sns/web/v1/note/like"],
    ["dislike", "/api/sns/web/v1/note/dislike"],
    ["collect", "/api/sns/web/v1/note/collect"],
    ["uncollect", "/api/sns/web/v1/note/uncollect"],
    ["post-comment", "/api/sns/web/v1/comment/post"],
    ["upload-permit", "/api/media/v1/upload/creator/permit"],
    ["upload-image", ""],
    ["publish-note", "/web_api/sns/v2/note"],
  ].map(([route, apiPath]) => endpoint({ id: `xhs-${route}`, platformId: "xhs", name: route, method: route === "upload-image" ? "POST" : "POST", path: `/api/xhs/${route}`, params: [p("payload", false, "{}")], handler: apiPath ? ((ctx) => xhsRequest(ctx, apiPath, { body: parseJson(ctx.body) })) : notPorted("图片上传需要 multipart/base64 文件管线。") })),

  ...[
    ["home-latest", "HomeLatestTimeline", "eObmT5Nuapp04u8bYWf49Q", () => ({ count: 20, includePromotedContent: true, latestControlAvailable: true })],
    ["search", "SearchTimeline", "XN_HccZ9SU-miQVvwTAlFQ", (ctx) => ({ rawQuery: requireQuery(ctx.url, "query"), count: 20, querySource: "typed_query", product: getQuery(ctx.url, "product", "Top") }), [p("query", true, "OpenAI"), p("product", false, "Top")]],
    ["user-info", "UserByScreenName", "IGgvgiOx4QZndDHuD3x9TQ", (ctx) => ({ screen_name: requireQuery(ctx.url, "screenName") }), [p("screenName", true, "OpenAI")]],
    ["tweet-detail", "TweetDetail", "QrLp7AR-eMyamw8D1N9l6A", (ctx) => ({ focalTweetId: requireQuery(ctx.url, "tweetId"), with_rux_injections: false, rankingMode: "Relevance", includePromotedContent: true, withCommunity: true }), [p("tweetId", true, "")]],
    ["user-tweets", "UserTweets", "naBcZ4al-iTCFBYGOAMzBQ", (ctx) => ({ userId: requireQuery(ctx.url, "userId"), count: 20, includePromotedContent: true, withQuickPromoteEligibilityTweetFields: true, withVoice: true }), [p("userId", true, "")]],
    ["following", "Following", "lQxnNSmlJkQHod0yzbVYDg", (ctx) => ({ userId: requireQuery(ctx.url, "userId"), count: 20, includePromotedContent: false }), [p("userId", true, "")]],
  ].map(([route, operation, queryId, buildVariables, params = []]) =>
    endpoint({
      id: `x-${route}`,
      platformId: "x",
      name: route,
      path: `/api/x/${route}`,
      params,
      handler: async (ctx) => {
        const credential = buildXCredential({
          cookie: cookie(ctx.configStore, "xCookie"),
          authorization: cookie(ctx.configStore, "xAuthorization"),
        });
        const pathname = `/i/api/graphql/${queryId}/${operation}`;
        const tx = await getXTransactionId(pathname, "GET");
        const target = new URL(`https://x.com${pathname}`);
        target.searchParams.set("variables", JSON.stringify(buildVariables(ctx)));
        target.searchParams.set("features", JSON.stringify({
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
        }));
        return fetchJson(ctx.fetchImpl, target.toString(), {
          headers: buildXHeaders(credential, { "x-client-transaction-id": tx }),
        });
      },
    }),
  ),
  ...[
    "home-latest-next", "home", "home-next", "home-refresh", "follow", "unfollow", "translate", "create-tweet", "repost", "upload-media", "verify-credentials", "favorite", "unfavorite",
  ].map((route) => endpoint({ id: `x-${route}`, platformId: "x", name: route, method: ["follow", "unfollow", "create-tweet", "repost", "upload-media", "favorite", "unfavorite"].includes(route) ? "POST" : "GET", path: `/api/x/${route}`, params: [p("payload", false, "{}")], handler: notPorted("X 该接口需要更完整的 variables/features 或媒体上传流程。") })),
].map(normalizeEndpointName);

function listEndpoints() {
  return endpoints.map(({ handler: _handler, ...rest }) => rest);
}

async function executeApiEndpoint({ method, pathname, url, fetchImpl, configStore, body }) {
  const item = endpoints.find((candidate) => candidate.method === method && candidate.path === pathname);
  if (!item?.handler) return null;
  return item.handler({ url, fetchImpl, configStore, body });
}

module.exports = {
  platforms,
  endpoints,
  listEndpoints,
  executeApiEndpoint,
};
