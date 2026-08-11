import axios from "axios";
import { getOrSetCookie, buildCommonHeaders } from "../utils/apiUtils";
import { signDouyinUrl } from "../utils/signature";
import { showError } from "../utils/errorMessage";

axios.defaults.timeout = 10000;

const DOUYIN_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";

const signedGet = async (
  url: string,
  extraHeaders: Record<string, string> = {},
) => {
  const signedUrl = signDouyinUrl(url, DOUYIN_UA);
  const headers = await getDouyinHeaders({
    "User-Agent": DOUYIN_UA,
    ...extraHeaders,
  });
  return axios.get(signedUrl, { headers });
};

const liveRoomToAweme = (room: any) => ({
  aweme_id: `live-${room?.id_str || room?.id || room?.owner?.web_rid || "unknown"}`,
  aweme_type: 101,
  author: room?.owner,
  cell_room: { rawdata: JSON.stringify(room) },
  statistics: {},
});

export const getOrSetDouyinCookie = async () => {
  return await getOrSetCookie("douyinCookie", "请输入抖音Cookie（可在浏览器登录douyin.com后通过控制台抓取）");
};

export const getDouyinHeaders = async (extraHeaders = {}) => {
  const cookie = (await getOrSetDouyinCookie()) as string;
  return buildCommonHeaders(cookie, {
    Referer: "https://www.douyin.com/",
    Origin: "https://www.douyin.com",
    ...extraHeaders,
  });
};

/**
 * 获取抖音推荐视频流 (个性化推荐)
 * 接口: https://www.douyin.com/aweme/v1/web/tab/feed/
 */
export const getDouyinFeed = async (
  refreshIndex: number = 1,
  viewCount: number = 0,
) => {
  try {
    const params = new URLSearchParams({
      device_platform: "webapp",
      aid: "6383",
      channel: "channel_pc_web",
      filterGids: "",
      tag_id: "",
      share_aweme_id: "",
      live_insert_type: "",
      count: "10",
      refresh_index: String(refreshIndex),
      video_type_select: "1",
      aweme_pc_rec_raw_data: JSON.stringify({
        is_client: false,
        ff_danmaku_status: 1,
        danmaku_switch_status: 1,
        is_dash_user: 1,
        related_recommend: 1,
        is_xigua_user: 0,
      }),
      globalwid: "",
      pull_type: "2",
      min_window: "0",
      free_right: "0",
      view_count: String(viewCount),
      plug_block: "0",
      ug_source: "",
      creative_id: "",
      pc_client_type: "1",
      pc_libra_divert: "Windows",
      support_h265: "1",
      support_dash: "1",
      webcast_sdk_version: "170400",
      webcast_version_code: "170400",
      version_code: "170400",
      version_name: "17.4.0",
      cookie_enabled: "true",
      screen_width: "1920",
      screen_height: "1080",
      browser_language: "zh-CN",
      browser_platform: "Win32",
      browser_name: "Chrome",
      browser_version: "151.0.0.0",
      browser_online: "true",
      engine_name: "Blink",
      engine_version: "151.0.0.0",
      os_name: "Windows",
      os_version: "10",
      platform: "PC",
      timestamp: String(Math.floor(Date.now() / 1000)),
    });
    const apiPath = `https://www.douyin.com/aweme/v1/web/tab/feed/?${params.toString()}`;
    const response = await signedGet(apiPath, {
      Referer: "https://www.douyin.com/?recommend=1",
    });
    return response.data;
  } catch (error: any) {
    showError(`获取抖音推荐流失败: ${error.message}`);
    return {
      status_code: -1,
      aweme_list: [],
    };
  }
};

/**
 * 获取用户喜欢的视频列表
 * 接口: https://www.douyin.com/aweme/v1/web/aweme/favorite/
 */
export const getDouyinFavorites = async (maxCursor: number = 0) => {
  try {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
    const apiPath = `https://www.douyin.com/aweme/v1/web/aweme/favorite/?device_platform=webapp&aid=6383&channel=channel_pc_web&pc_client_type=1&max_cursor=${maxCursor}&count=10&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32`;
    
    const signedUrl = signDouyinUrl(apiPath, ua);
    const headers = await getDouyinHeaders({
      "User-Agent": ua,
    });

    const response = await axios.get(signedUrl, { headers });
    return response.data;
  } catch (error: any) {
    showError(`获取抖音喜欢视频失败: ${error.message}`);
    return {
      status_code: -1,
      aweme_list: [],
      max_cursor: maxCursor,
      has_more: 0,
    };
  }
};

/**
 * 获取指定作者作品列表
 * 接口: https://www.douyin.com/aweme/v1/web/aweme/post/
 */
export const getDouyinUserPosts = async (
  secUserId: string,
  maxCursor: number = 0,
) => {
  try {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
    const params = new URLSearchParams({
      device_platform: "webapp",
      aid: "6383",
      channel: "channel_pc_web",
      sec_user_id: secUserId,
      max_cursor: String(maxCursor),
      count: "18",
      publish_video_strategy_type: "2",
      pc_client_type: "1",
      version_code: "170400",
      version_name: "17.4.0",
      cookie_enabled: "true",
      browser_language: "zh-CN",
      browser_platform: "Win32",
      browser_name: "Chrome",
      browser_version: "129.0.0.0",
      browser_online: "true",
      engine_name: "Blink",
      engine_version: "129.0.0.0",
      os_name: "Windows",
      os_version: "10",
      platform: "PC",
    });
    const apiPath = `https://www.douyin.com/aweme/v1/web/aweme/post/?${params.toString()}`;

    const signedUrl = signDouyinUrl(apiPath, ua);
    const headers = await getDouyinHeaders({
      "User-Agent": ua,
      "Referer": `https://www.douyin.com/user/${secUserId}`,
    });

    const response = await axios.get(signedUrl, { headers });
    return response.data;
  } catch (error: any) {
    showError(`获取抖音作者作品失败: ${error.message}`);
    return {
      status_code: -1,
      aweme_list: [],
      max_cursor: maxCursor,
      has_more: 0,
    };
  }
};

/**
 * 获取视频评论列表
 * 接口: https://www.douyin.com/aweme/v1/web/comment/list/
 */
export const getDouyinComments = async (awemeId: string, cursor: number = 0) => {
  try {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
    const params = new URLSearchParams({
      device_platform: "webapp",
      aid: "6383",
      channel: "channel_pc_web",
      aweme_id: awemeId,
      pc_img_format: "webp",
      cursor: String(cursor),
      count: "10",
      item_type: "0",
      insert_ids: "",
      whale_cut_token: "",
      cut_version: "1",
      rcFT: "",
      update_version_code: "170400",
      pc_client_type: "1",
      pc_libra_divert: "Windows",
      support_h265: "1",
      support_dash: "1",
      cpu_core_num: "22",
      version_code: "170400",
      version_name: "17.4.0",
      cookie_enabled: "true",
      screen_width: "1646",
      screen_height: "1098",
      browser_language: "zh-CN",
      browser_platform: "Win32",
      browser_name: "Chrome",
      browser_version: "129.0.0.0",
      browser_online: "true",
      engine_name: "Blink",
      engine_version: "129.0.0.0",
      os_name: "Windows",
      os_version: "10",
      device_memory: "32",
      platform: "PC",
      downlink: "5.75",
      effective_type: "4g",
      round_trip_time: "50",
    });
    const apiPath = `https://www-hj.douyin.com/aweme/v1/web/comment/list/?${params.toString()}`;
    
    const signedUrl = signDouyinUrl(apiPath, ua);
    const headers = await getDouyinHeaders({
      "User-Agent": ua,
      "Referer": `https://www.douyin.com/video/${awemeId}`,
    });

    console.log(`[getDouyinComments] 开始请求评论: awemeId=${awemeId}, cursor=${cursor}`);
    const response = await axios.get(signedUrl, { headers });
    console.log(`[getDouyinComments] 请求完成: status_code=${response.data.status_code}, comments count=${response.data.comments?.length || 0}, has_more=${response.data.has_more}, cursor=${response.data.cursor}`);
    
    return response.data;
  } catch (error: any) {
    console.error(`[getDouyinComments] 请求失败: ${error.message}`);
    showError(`获取抖音评论失败: ${error.message}`);
    return {
      status_code: -1,
      comments: [],
      total: 0,
      cursor: cursor,
      has_more: 0,
    };
  }
};

/**
 * 抖音视频点赞与取消点赞 (喜欢/取消喜欢)
 * 接口: https://www.douyin.com/aweme/v1/web/commit/item/digg/
 */
export const diggDouyinVideo = async (awemeId: string, type: number) => {
  try {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
    const apiPath = `https://www.douyin.com/aweme/v1/web/commit/item/digg/?device_platform=webapp&aid=6383&channel=channel_pc_web&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32`;
    
    // 构建 POST Body 并序列化
    const postDataStr = `aweme_id=${awemeId}&type=${type}`;
    
    // 对 URL 和 Body 组合签名以过 xbogus 校验
    const signedUrl = signDouyinUrl(apiPath + "&" + postDataStr, ua);
    
    // 从 Cookie 提取 passport_csrf_token，防止 403 跨站伪造拦截
    const cookie = (await getOrSetDouyinCookie()) as string;
    const csrfMatch = cookie.match(/passport_csrf_token=([^;]+)/);
    const csrfToken = csrfMatch ? csrfMatch[1] : "";
    
    const headers = await getDouyinHeaders({
      "User-Agent": ua,
      "Referer": `https://www.douyin.com/video/${awemeId}`,
      "Origin": "https://www.douyin.com",
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Secsdk-Csrf-Token": csrfToken
    });

    console.log(`[diggDouyinVideo] 请求点赞接口: awemeId=${awemeId}, type=${type}, csrfToken=${csrfToken ? "存在" : "缺失"}`);
    const response = await axios.post(signedUrl, postDataStr, { headers });
    console.log(`[diggDouyinVideo] 点赞接口返回: status_code=${response.data.status_code}, status_msg=${response.data.status_msg}`);
    
    return response.data;
  } catch (error: any) {
    console.error(`[diggDouyinVideo] 点赞接口异常: ${error.message}`);
    showError(`抖音视频喜欢操作失败: ${error.message}`);
    return {
      status_code: -1,
      status_msg: error.message
    };
  }
};

/**
 * 获取博主关注视频流
 * 接口: https://www.douyin.com/aweme/v1/web/follow/feed/
 */
export const getDouyinFollowing = async (maxCursor: number = 0) => {
  try {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
    const apiPath = `https://www.douyin.com/aweme/v1/web/follow/feed/?device_platform=webapp&aid=6383&channel=channel_pc_web&count=10&min_cursor=0&max_cursor=${maxCursor}&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32`;
    
    const signedUrl = signDouyinUrl(apiPath, ua);
    const headers = await getDouyinHeaders({
      "User-Agent": ua,
      "Referer": "https://www.douyin.com/follow",
    });

    const response = await axios.get(signedUrl, { headers });
    
    // 关注视频流接口返回的数据格式是包在 data[].aweme 中，在此进行扁平化提取
    const rawData = response.data.data || [];
    const awemeList = rawData.map((item: any) => item.aweme).filter(Boolean);

    return {
      status_code: response.data.status_code,
      aweme_list: awemeList,
      max_cursor: response.data.cursor || maxCursor,
      has_more: response.data.has_more === 1 || response.data.has_more === true,
    };
  } catch (error: any) {
    showError(`获取关注视频流失败: ${error.message}`);
    return {
      status_code: -1,
      aweme_list: [],
      max_cursor: maxCursor,
      has_more: false,
    };
  }
};

export const getDouyinDanmaku = async (
  awemeId: string,
  duration: number,
  start: number,
) => {
  const end = Math.max(start, Math.min(start + 32_000, duration));
  const params = new URLSearchParams({
    device_platform: "webapp",
    aid: "6383",
    channel: "channel_pc_web",
    app_name: "aweme",
    format: "json",
    group_id: awemeId,
    item_id: awemeId,
    start_time: String(start),
    end_time: String(end),
    duration: String(duration),
    update_version_code: "170400",
    pc_client_type: "1",
    cookie_enabled: "true",
    browser_language: "zh-CN",
    browser_platform: "Win32",
  });
  const headers = await getDouyinHeaders({
    "User-Agent": DOUYIN_UA,
    Referer: "https://www.douyin.com/",
    Accept: "application/json, text/plain, */*",
    "Accept-Encoding": "identity",
  });
  const response = await axios.get(
    `https://www-hj.douyin.com/aweme/v1/web/danmaku/get_v2/?${params.toString()}`,
    { headers, timeout: 15_000 },
  );
  return response.data;
};

export const resolveDouyinPlayUrl = async (playUrl: string) => {
  const parsed = new URL(playUrl);
  const isDouyinHost = parsed.hostname === "douyin.com" || parsed.hostname.endsWith(".douyin.com");
  if (!isDouyinHost || !parsed.pathname.includes("/aweme/v1/play/")) {
    throw new Error("不允许解析非抖音播放入口");
  }
  const headers = await getDouyinHeaders({
    "User-Agent": DOUYIN_UA,
    Referer: "https://www.douyin.com/",
    Range: "bytes=0-0",
  });
  const response = await axios.get(playUrl, {
    headers,
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 400,
  });
  const resolved = response.headers.location;
  return { url: typeof resolved === "string" && resolved ? resolved : playUrl };
};

export const getDouyinLiveFeed = async (maxTime: number = 0) => {
  const params = new URLSearchParams({
    aid: "6383",
    app_name: "douyin_web",
    live_id: "1",
    device_platform: "web",
    language: "zh-CN",
    enter_from: "page_refresh",
    cookie_enabled: "true",
    screen_width: "1920",
    screen_height: "1080",
    browser_language: "zh-CN",
    browser_platform: "Win32",
    browser_name: "Chrome",
    browser_version: "151.0.0.0",
    os_name: "Windows",
    os_version: "10",
    channel: "channel_pc_web",
    request_tag_from: "web",
    need_map: "1",
    liveid: "1",
    is_draw: "1",
    inner_from_drawer: "0",
    custom_count: "50",
    action: "load_more",
    action_type: "loadmore",
    enter_source: "web_homepage_hot_web_live_card",
    source_key: "web_homepage_hot_web_live_card",
    is_ssr: "true",
  });
  if (maxTime > 0) params.set("max_time", String(maxTime));

  const response = await signedGet(
    `https://live-hj.douyin.com/webcast/feed/?${params.toString()}`,
    {
      Referer: "https://live.douyin.com/",
      Origin: "https://live.douyin.com",
    },
  );
  const payload = response.data;
  const rooms = (payload.data || [])
    .filter((entry: any) => (entry.type == null || entry.type === 1) && entry.data)
    .map((entry: any) => entry.data)
    .filter((room: any) => room?.owner?.web_rid)
    .map(liveRoomToAweme);
  return {
    status_code: payload.status_code,
    status_msg: payload.status_msg,
    aweme_list: rooms,
    max_time: payload.extra?.max_time || maxTime,
    has_more: payload.extra?.has_more ?? true,
  };
};

export const getDouyinFollowedLiveRooms = async () => {
  const params = new URLSearchParams({
    aid: "6383",
    app_name: "douyin_web",
    live_id: "1",
    device_platform: "web",
    language: "zh-CN",
    enter_from: "page_refresh",
    cookie_enabled: "true",
    screen_width: "1920",
    screen_height: "1080",
    browser_language: "zh-CN",
    browser_platform: "Win32",
    browser_name: "Chrome",
    browser_version: "151.0.0.0",
    os_name: "Windows",
    os_version: "10",
    enter_source: "homepage_pc_followtop",
    need_pinned_info: "0",
    follow_session_id: "0",
    source_key: "web_homepage_follow_top",
    webcast_version_code: "170400",
    version_code: "170400",
    need_map: "1",
  });
  const response = await signedGet(
    `https://live.douyin.com/webcast/feed/follow_top/?${params.toString()}`,
    {
      Referer: "https://live.douyin.com/",
      Origin: "https://live.douyin.com",
    },
  );
  const payload = response.data;
  const rooms = (payload.data || [])
    .filter((entry: any) => entry.type === 2 && entry.data)
    .map((entry: any) => entry.data)
    .filter((room: any) => room?.owner?.web_rid)
    .map(liveRoomToAweme);
  return {
    status_code: payload.status_code,
    status_msg: payload.status_msg,
    aweme_list: rooms,
    has_more: false,
  };
};

export const getDouyinPlayableLiveRoom = async (webRid: string) => {
  const params = new URLSearchParams({
    aid: "6383",
    app_name: "douyin_web",
    live_id: "1",
    device_platform: "web",
    language: "zh-CN",
    browser_language: "zh-CN",
    browser_platform: "Win32",
    browser_name: "Chrome",
    browser_version: "151.0.0.0",
    web_rid: webRid,
    msToken: "",
  });
  const response = await signedGet(
    `https://live.douyin.com/webcast/room/web/enter/?${params.toString()}`,
    {
      Referer: `https://live.douyin.com/${webRid}`,
      Origin: "https://live.douyin.com",
    },
  );
  const payload = response.data;
  const room = payload.data?.data?.[0];
  const hlsMap = room?.stream_url?.hls_pull_url_map || {};
  const hasPlayableHls = Boolean(
    room?.stream_url?.hls_pull_url || Object.values(hlsMap).some(Boolean),
  );
  if (payload.status_code !== 0 || room?.status !== 2 || !hasPlayableHls) {
    throw new Error(payload.status_msg || "直播间已结束或暂无可播放线路");
  }
  return {
    status_code: payload.status_code,
    status_msg: payload.status_msg,
    room,
    aweme: room ? liveRoomToAweme(room) : null,
  };
};

export const getDouyinUserProfile = async (secUserId: string) => {
  const params = new URLSearchParams({
    device_platform: "webapp",
    aid: "6383",
    channel: "channel_pc_web",
    sec_user_id: secUserId,
    publish_video_strategy_type: "2",
    personal_center_strategy: "1",
    pc_client_type: "1",
    version_code: "170400",
    version_name: "17.4.0",
    cookie_enabled: "true",
    browser_language: "zh-CN",
    browser_platform: "Win32",
    browser_name: "Chrome",
    browser_version: "151.0.0.0",
    browser_online: "true",
    engine_name: "Blink",
    engine_version: "151.0.0.0",
    os_name: "Windows",
    os_version: "10",
    platform: "PC",
  });
  const response = await signedGet(
    `https://www.douyin.com/aweme/v1/web/user/profile/other/?${params.toString()}`,
    { Referer: `https://www.douyin.com/user/${secUserId}` },
  );
  return response.data;
};
