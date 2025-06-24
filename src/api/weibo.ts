/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-19 13:54:53
 * @LastEditTime: 2025-06-24 13:54:17
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\weibo.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */
import axios from "axios";
import * as vscode from "vscode";
import { setConfigByKey } from "../config";

axios.interceptors.response.use(
  (value) => value,
  (error) => {
    console.log("Weibo API Error:", error);
    vscode.window.showErrorMessage(
      `请求失败:${error.message} -------> ${error.config.url}`
    );
    return Promise.reject(error);
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

export const getWeiboData = async (url: string) => {
  const cookie = (await getOrSetWeiboCookie()) as string;
  return await axios.get(`https://weibo.com/ajax/feed${url}`, {
    headers: {
      Cookie: cookie,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
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

// 获取微博评论
export const getWeiboComment = async (url: string) => {
  const cookie = (await getOrSetWeiboCookie()) as string;
  return await axios.get(`https://weibo.com/ajax${url}`, {
    headers: {
      Cookie: cookie,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
  });
};

// 获取长微博
export const getLongText = async (id: string) => {
  const cookie = (await getOrSetWeiboCookie()) as string;
  return await axios.get(`https://weibo.com/ajax/statuses/longtext?id=${id}`, {
    headers: {
      Cookie: cookie,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    },
  });
};

// 查看博主 https://weibo.com/ajax/statuses/mymblog?uid=5766179244&page=1&feature=0
export const getUserWeibo = async (params: string) => {
  const cookie = (await getOrSetWeiboCookie()) as string;
  const parsedParams = JSON.parse(params);
  console.log("getUserWeibo", parsedParams);
  return await axios.get(
    `https://weibo.com/ajax/statuses/mymblog?uid=${parsedParams.uid}&page=${parsedParams.page}&feature=0`,
    {
      headers: {
        Cookie: cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      },
    }
  );
};

// 关注博主 https://weibo.com/ajax/friendships/create friend_uid
export const followUser = async (friend_uid: string) => {
  const cookie = (await getOrSetWeiboCookie()) as string;
  const xsrf = cookie.match(/XSRF-TOKEN=(.*?);/)?.[1] ?? "";
  return await axios.post(
    `https://weibo.com/ajax/friendships/create`,
    {
      friend_uid: friend_uid + "",
      lpage: "homeRecom",
      page: "profile",
    },
    {
      headers: {
        Cookie: cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "X-Xsrf-Token": xsrf,
      },
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

type weiboCommentParams = {
  id: string; // 微博ID
  comment: string; // 评论内容
  pic_id?: string; // 图片ID ""
  is_repost?: number; // 0
  comment_ori?: number; //0
  is_comment?: number; //0
}

type weiboRepostParams = {
  id: string; // 微博ID
  comment: string; // 转发评论内容
  pic_id?: string; // 图片ID ""
  is_repost?: number; //0
  comment_ori?: number; //0
  is_comment?: number; //0
  visible?:number //0
  share_id?: string; //""
}
export const sendWeibo = async (params: string) => {
  const cookie = (await getOrSetWeiboCookie()) as string;
  const parsedParams = JSON.parse(params) as weiboSendParams;
  const xsrf = cookie.match(/XSRF-TOKEN=(.*?);/)?.[1] ?? "";
  return await axios.post(
    `https://weibo.com/ajax/statuses/update`,
    parsedParams,
    {
      headers: {
        Cookie: cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "X-Xsrf-Token": xsrf,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
};

// 上传图片 https://picupload.weibo.com/interface/pic_upload.php?app=miniblog&s=json&p=1&data=1&url=weibo.com%2Fu%2F7515513422&markpos=1&logo=1&nick=ylwgg&file_source=4&_rid=ZoWn_8FNOXSvGid5
export const uploadImage = async (file: string) => {
  const cookie = (await getOrSetWeiboCookie()) as string;
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
    headers: {
      Cookie: cookie,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
      "Content-Type": "application/octet-stream",
    },
    data: buffer,
  });
};

// 取消关注博主 https://weibo.com/ajax/friendships/destory
export const cancelfollowUser = async (uid: string) => {
  const cookie = (await getOrSetWeiboCookie()) as string;
  const xsrf = cookie.match(/XSRF-TOKEN=(.*?);/)?.[1] ?? "";
  return await axios.post(
    `https://weibo.com/ajax/friendships/destory`,
    { uid },
    {
      headers: {
        Cookie: cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "X-Xsrf-Token": xsrf,
      },
    }
  );
};


// like https://weibo.com/ajax/statuses/setLike {"id":"5181037522454301"}
export const setLike = async (id: string) => {
  const cookie = (await getOrSetWeiboCookie()) as string;
  const xsrf = cookie.match(/XSRF-TOKEN=(.*?);/)?.[1] ?? "";
  return await axios.post(
    `https://weibo.com/ajax/statuses/setLike`,
    { id },
    {
      headers: {
        Cookie: cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "X-Xsrf-Token": xsrf,
      },
    }
  );
};
// cancelLike https://weibo.com/ajax/statuses/cancelLike {"id":"5181037522454301"}
export const cancelLike = async (id: string) => {
  const cookie = (await getOrSetWeiboCookie()) as string;
  const xsrf = cookie.match(/XSRF-TOKEN=(.*?);/)?.[1] ?? "";
  return await axios.post(
    `https://weibo.com/ajax/statuses/cancelLike`,
    { id },
    {
      headers: {
        Cookie: cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "X-Xsrf-Token": xsrf,
      },
    }
  );
};

// 评论 
export const createComments = async (params: string) => {
  const cookie = (await getOrSetWeiboCookie()) as string;
  const parsedParams = JSON.parse(params) as weiboCommentParams;
  const xsrf = cookie.match(/XSRF-TOKEN=(.*?);/)?.[1] ?? "";
  return await axios.post(
    `https://weibo.com/ajax/comments/create`,
    parsedParams,
    {
      headers: {
        Cookie: cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "X-Xsrf-Token": xsrf,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
};


// 转发
export const createRepost = async (params: string) => {
  const cookie = (await getOrSetWeiboCookie()) as string;
  const parsedParams = JSON.parse(params) as weiboRepostParams;
  const xsrf = cookie.match(/XSRF-TOKEN=(.*?);/)?.[1] ?? "";
  return await axios.post(
    `https://weibo.com/ajax/statuses/normal_repost`,
    parsedParams,
    {
      headers: {
        Cookie: cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "X-Xsrf-Token": xsrf,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
};