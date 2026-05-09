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
  if (entries.length === 0) return apiPath;
  const qs = entries
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `${apiPath}?${qs}` : apiPath;
}

function _notPorted(reason) {
  return async () => ({
    ok: false,
    status: 501,
    data: {
      message: reason,
      next: "需要把原扩展里的签名、上传或浏览器态逻辑抽到 server core 后再启用。",
    },
  });
}

function normalizeEndpointName(endpoint) {
  const name = endpointNameOverrides[endpoint.id];
  if (name) endpoint.name = name;
  return endpoint;
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
  "xiaoyuzhou-refresh-token": "刷新 token",
  "xiaoyuzhou-discovery-feed": "发现流",
  "xiaoyuzhou-inbox": "收件箱",
  "xiaoyuzhou-pilot-discovery": "编辑精选",
  "xiaoyuzhou-top-list": "榜单",
  "xiaoyuzhou-search": "搜索播客",
  "xiaoyuzhou-podcast-detail": "播客详情",
  "xiaoyuzhou-episode-list": "单集列表",
  "xiaoyuzhou-episode-detail": "单集详情",
  "xiaoyuzhou-episode-transcript": "单集转录",
  "xiaoyuzhou-subscriptions": "订阅列表",
  "xiaoyuzhou-update-subscription": "更新订阅",
  "xiaoyuzhou-send-sms": "发送验证码",
  "xiaoyuzhou-login-sms": "短信登录",
  "qqmusic-search-songs": "搜索歌曲",
  "qqmusic-search-singers": "搜索歌手",
  "qqmusic-lyric": "歌词",
};

module.exports = {
  p,
  endpoint,
  getQuery,
  requireQuery,
  cookie,
  userIdFromCookie,
  _csrfFromCookie,
  parseJson,
  stableStringify,
  xhsGetPath,
  _notPorted,
  normalizeEndpointName,
  endpointNameOverrides,
};
