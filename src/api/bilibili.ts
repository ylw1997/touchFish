/*
 * @Description: Bilibili API 调用
 */
import axios from "axios";
import { getOrSetCookie, buildCommonHeaders } from "../utils/apiUtils";
import { showError } from "../utils/errorMessage";

axios.defaults.timeout = 10000;

export const getOrSetBilibiliCookie = async () => {
  return await getOrSetCookie("bilibiliCookie", "请输入B站的cookie");
};

const getBilibiliHeaders = async (extraHeaders = {}) => {
  const cookie = (await getOrSetBilibiliCookie()) as string;
  return buildCommonHeaders(cookie, {
    Referer: "https://www.bilibili.com/",
    Origin: "https://www.bilibili.com",
    ...extraHeaders,
  });
};

/**
 * 获取推荐视频列表
 * https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd
 */
export const getRecommend = async () => {
  try {
    return await axios.get(
      `https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd`,
      {
        headers: await getBilibiliHeaders(),
      }
    );
  } catch (error: any) {
    showError(`获取B站推荐失败: ${error.message}`);
    return {
      data: {
        code: -1,
        message: error.message,
        data: { item: [] },
      },
    };
  }
};
