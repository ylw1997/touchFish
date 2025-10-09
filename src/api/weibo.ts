/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-19 13:54:53
 * @LastEditTime: 2025-09-25 10:57:42
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\weibo.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import axios from "axios";
import * as vscode from "vscode";
import { setConfigByKey } from "../core/config";
import { weiboCommentParams, weiboRepostParams } from "../../type";
import ContextManager from "../utils/extensionContext";
import * as fs from "fs";
import { Uri } from "vscode";

axios.defaults.timeout = 10000;

axios.interceptors.response.use(
  (value) => value,
  (error) => {
    if (error.response && error.response.status === 432) {
      return Promise.reject(error);
    }
    vscode.window.showErrorMessage(
      `请求失败:${error.message} -------> ${error.config.url}`
    );
    return Promise.resolve({
      data: {
        ok: 0,
        msg: error.message,
      },
    });
  }
);

export const getOrSetWeiboCookie = async () => {
  const config = vscode.workspace.getConfiguration("touchfish");
  let cookie = config.get("weiboCookie") as string | undefined;
  // 如果没有就请输入cookie
  if (!cookie) {
    cookie = await vscode.window.showInputBox({
      placeHolder: "请输入微博的cookie",
      prompt: "请输入微博的cookie",
    });
    if (cookie) {
      await setConfigByKey("weiboCookie", cookie);
    }
  }
  return cookie;
};

const getWeiboHeaders = async (extraHeaders = {}) => {
  const cookie = (await getOrSetWeiboCookie()) as string;
  const xsrf = cookie.match(/XSRF-TOKEN=(.*?);/)?.[1] ?? "";
  return {
    Cookie: cookie,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    "X-Xsrf-Token": xsrf,
    Referer: "https://weibo.com/",
    Connection: "close",
    ...extraHeaders,
  };
};

export const getWeiboData = async (url: string) => {
  return await axios.get(`https://weibo.com/ajax/feed${url}`, {
    headers: await getWeiboHeaders(),
  });
};

export const getWeiboImg = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      referer: "https://weibo.com/",
    },
  });
  const blob = await res.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());
  return "data:" + blob.type + ";base64," + buffer.toString("base64");
};

export const downloadVideoAsFile = async (url: string): Promise<string> => {
  const context = ContextManager.context;
  return await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "正在加载视频",
      cancellable: false,
    },
    async (progress) => {
      progress.report({ increment: 0, message: "准备下载" });
      let lastReportedPercent = 0;
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        headers: {
          referer: "https://weibo.com/",
        },
        timeout: 0,
        onDownloadProgress: (progressEvent) => {
          const total = progressEvent.total;
          if (total) {
            const downloadPercent = Math.round(
              (progressEvent.loaded * 100) / total
            );
            // 下载占总进度的95%
            const overallPercent = Math.floor(downloadPercent * 0.95);
            const increment = overallPercent - lastReportedPercent;
            if (increment > 0) {
              progress.report({
                message: `下载中... ${downloadPercent}%`,
                increment: increment,
              });
              lastReportedPercent = overallPercent;
            }
          }
        },
      });

      // 报告写入文件
      const incrementToWrite = 98 - lastReportedPercent;
      progress.report({
        increment: incrementToWrite,
        message: "正在写入视频...",
      });

      const tempDir = Uri.joinPath(context.extensionUri, "temp");
      if (!fs.existsSync(tempDir.fsPath)) {
        fs.mkdirSync(tempDir.fsPath);
      }
      const tempFilePath = Uri.joinPath(tempDir, `${Date.now()}.mp4`);
      fs.writeFileSync(tempFilePath.fsPath, response.data);

      // 报告完成
      const incrementToComplete = 100 - 98;
      progress.report({
        increment: incrementToComplete,
        message: "视频加载完成!",
      });

      // 短暂延迟，让用户看到“完成”
      await new Promise((resolve) => setTimeout(resolve, 500));

      return tempFilePath.fsPath;
    }
  );
};

// 获取微博评论
export const getWeiboComment = async (url: string) => {
  return await axios.get(`https://weibo.com/ajax${url}`, {
    headers: await getWeiboHeaders(),
  });
};

// 获取长微博
export const getLongText = async (id: string) => {
  return await axios.get(`https://weibo.com/ajax/statuses/longtext?id=${id}`, {
    headers: await getWeiboHeaders(),
  });
};

// 查看博主 https://weibo.com/ajax/statuses/mymblog?uid=5766179244&page=1&feature=0
export const getUserWeibo = async (params: string) => {
  const parsedParams = JSON.parse(params);
  return await axios.get(
    `https://weibo.com/ajax/statuses/mymblog?uid=${parsedParams.uid}&page=${parsedParams.page}&feature=0`,
    {
      headers: await getWeiboHeaders(),
    }
  );
};

// 关注博主 https://weibo.com/ajax/friendships/create friend_uid
export const followUser = async (friend_uid: string) => {
  return await axios.post(
    `https://weibo.com/ajax/friendships/create`,
    {
      friend_uid: friend_uid + "",
      lpage: "homeRecom",
      page: "profile",
    },
    {
      headers: await getWeiboHeaders(),
    }
  );
};

// 发布微博 https://weibo.com/ajax/statuses/update
type weiboVisible = {
  0: "公开";
  1: "自己";
  6: "好友圈";
  10: "粉丝";
};
type weiboSendParams = {
  content: string;
  visible?: weiboVisible[keyof weiboVisible];
  vote?: string;
  media?: string;
};

export const sendWeibo = async (params: string) => {
  const parsedParams = JSON.parse(params) as weiboSendParams;
  return await axios.post(
    `https://weibo.com/ajax/statuses/update`,
    parsedParams,
    {
      headers: await getWeiboHeaders({
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    }
  );
};

// 上传图片 https://picupload.weibo.com/interface/pic_upload.php?app=miniblog&s=json&p=1&data=1&url=weibo.com%2Fu%2F7515513422&markpos=1&logo=1&nick=ylwgg&file_source=4&_rid=ZoWn_8FNOXSvGid5
export const uploadImage = async (file: string) => {
  // 将 base64 转为二进制 Buffer
  const buffer = Buffer.isBuffer(file)
    ? file
    : Buffer.from(
        file.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""),
        "base64"
      );
  return await axios.request({
    url: `https://picupload.weibo.com/interface/pic_upload.php?app=miniblog&p=1&data=1`,
    method: "POST",
    headers: await getWeiboHeaders({
      "Content-Type": "application/octet-stream",
    }),
    data: buffer,
  });
};

// 取消关注博主 https://weibo.com/ajax/friendships/destory
export const cancelfollowUser = async (uid: string) => {
  return await axios.post(
    `https://weibo.com/ajax/friendships/destory`,
    { uid },
    {
      headers: await getWeiboHeaders(),
    }
  );
};

// like https://weibo.com/ajax/statuses/setLike {"id":"5181037522454301"}
export const setLike = async (id: string) => {
  return await axios.post(
    `https://weibo.com/ajax/statuses/setLike`,
    { id },
    {
      headers: await getWeiboHeaders(),
    }
  );
};
// cancelLike https://weibo.com/ajax/statuses/cancelLike {"id":"5181037522454301"}
export const cancelLike = async (id: string) => {
  return await axios.post(
    `https://weibo.com/ajax/statuses/cancelLike`,
    { id },
    {
      headers: await getWeiboHeaders(),
    }
  );
};

// 评论
export const createComments = async (params: weiboCommentParams) => {
  return await axios.post(`https://weibo.com/ajax/comments/create`, params, {
    headers: await getWeiboHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
    }),
  });
};

// 转发
export const createRepost = async (params: weiboRepostParams) => {
  return await axios.post(
    `https://weibo.com/ajax/statuses/normal_repost`,
    params,
    {
      headers: await getWeiboHeaders({
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    }
  );
};

// 根据用户名查询用户信息
export const getUserByName = async (screen_name_or_id: string) => {
  let params = "";
  if (/^\d+$/.test(screen_name_or_id)) {
    params = `id=${screen_name_or_id}`;
  } else {
    params = `screen_name=${screen_name_or_id}`;
  }
  return await axios.get(`https://weibo.com/ajax/user/popcard/get?${params}`, {
    headers: await getWeiboHeaders(),
  });
};

// 获取热搜
export const getHotSearch = async () => {
  return await axios.get(`https://weibo.com/ajax/side/hotSearch`, {
    headers: await getWeiboHeaders(),
  });
};

// 微博H5搜索接口 https://m.weibo.cn/api/container/getIndex?containerid=100103type%3D3%26q%3D%E5%87%A1%E4%BA%BA%E4%BF%AE%E4%BB%99%E4%BC%A0%26t%3D&page_type=searchall
//containerid=100103type=3&q=凡人修仙传&t=
//type: 3 用户 60 热门
//card_type: 9 微博 11 卡片包裹 10 用户
export const getWeiboSearch = async (
  containerid: string,
  retries = 3
): Promise<any> => {
  const url = `https://m.weibo.cn/api/container/getIndex?containerid=${encodeURIComponent(
    containerid
  )}`;
  // console.log("Fetching Weibo Search Data:", url);
  try {
    return await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "x-requested-with": "XMLHttpRequest",
        Referer: "https://m.weibo.cn/",
      },
    });
  } catch (error: any) {
    console.error("Error fetching Weibo Search Data:", error.data);
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return getWeiboSearch(containerid, retries - 1);
    } else {
      vscode.window.showErrorMessage(`微博搜索请求失败: ${error.message}`);
      return Promise.resolve({
        data: {
          ok: 0,
          msg: error.message,
        },
      });
    }
  }
};
