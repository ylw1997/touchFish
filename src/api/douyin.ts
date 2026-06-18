import axios from "axios";
import { getOrSetCookie, buildCommonHeaders } from "../utils/apiUtils";
import { signDouyinUrl } from "../utils/signature";
import { showError } from "../utils/errorMessage";

axios.defaults.timeout = 10000;

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
 * 接口: https://www.douyin.com/aweme/v1/web/channel/feed/
 */
export const getDouyinFeed = async () => {
  try {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
    const apiPath = "https://www.douyin.com/aweme/v1/web/channel/feed/?device_platform=webapp&aid=6383&count=10&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32";
    
    // 生成签名 URL
    const signedUrl = signDouyinUrl(apiPath, ua);
    const headers = await getDouyinHeaders({
      "User-Agent": ua,
    });

    const response = await axios.get(signedUrl, { headers });
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
 * 获取视频评论列表
 * 接口: https://www.douyin.com/aweme/v1/web/comment/list/
 */
export const getDouyinComments = async (awemeId: string, cursor: number = 0) => {
  try {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
    const apiPath = `https://www.douyin.com/aweme/v1/web/comment/list/?device_platform=webapp&aid=6383&aweme_id=${awemeId}&cursor=${cursor}&count=20&item_type=0&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32`;
    
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
