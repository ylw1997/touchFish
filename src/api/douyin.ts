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
    const apiPath = "https://www.douyin.com/aweme/v1/web/channel/feed/?device_platform=webapp&aid=6383&channel=channel_pc_web&count=10&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32";
    
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
    const apiPath = `https://www.douyin.com/aweme/v1/web/comment/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&aweme_id=${awemeId}&cursor=${cursor}&count=20&cookie_enabled=true&browser_language=zh-CN&browser_platform=Win32`;
    
    const signedUrl = signDouyinUrl(apiPath, ua);
    const headers = await getDouyinHeaders({
      "User-Agent": ua,
      "Referer": `https://www.douyin.com/video/${awemeId}`,
    });

    const response = await axios.get(signedUrl, { headers });
    return response.data;
  } catch (error: any) {
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
