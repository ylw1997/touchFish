/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-19 13:54:53
 * @LastEditTime: 2025-06-12 16:40:17
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\weibo.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved. 
 * @Description: 
 */
import axios from "axios";
import * as vscode from 'vscode';
import { setConfigByKey } from "../config";

axios.interceptors.response.use((value) => {
  console.log("Weibo API Response:", value);
  return value;
},
  (error) => {
    console.log("Weibo API Error:", error);
  }
)

export const getOrSetWeiboCookie = async () => {
  const config = vscode.workspace.getConfiguration('touchfish');
  let cookie = config.get('weiboCookie') as string | undefined;
  // 如果没有就请输入cookie
  if (!cookie) {
    cookie = await vscode.window.showInputBox({
      placeHolder: "请输入微博的cookie",
      prompt: "请输入微博的cookie",
    });
    if (cookie) {
      await setConfigByKey('weiboCookie', cookie);
    }
  }
  return cookie;
};

export const getWeiboData = async (url: string) => {
  const cookie = await getOrSetWeiboCookie() as string;
  return await axios.get(`https://weibo.com/ajax/feed${url}`, {
    headers: {
      "Cookie": cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
    },
  })
}

export const getWeiboImg = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      'referer': 'https://weibo.com/'
    },
  })
  const blob = await res.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());
  return "data:" + blob.type + ';base64,' + buffer.toString('base64');
}

// 获取微博评论
export const getWeiboComment = async (url: string) => {
  const cookie = await getOrSetWeiboCookie() as string;
  return await axios.get(`https://weibo.com/ajax${url}`, {
    headers: {
      "Cookie": cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
    },
  })
}

// 获取长微博
export const getLongText = async (id: string) => {
  const cookie = await getOrSetWeiboCookie() as string;
  return await axios.get(`https://weibo.com/ajax/statuses/longtext?id=${id}`, {
    headers: {
      "Cookie": cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
    },
  })
}

// 查看博主 https://weibo.com/ajax/statuses/mymblog?uid=5766179244&page=1&feature=0
export const getUserWeibo = async (params: string) => {
  const cookie = await getOrSetWeiboCookie() as string;
  const parsedParams = JSON.parse(params);
  console.log("getUserWeibo", parsedParams);
  return await axios.get(`https://weibo.com/ajax/statuses/mymblog?uid=${parsedParams.uid}&page=${parsedParams.page}&feature=0`, {
    headers: {
      "Cookie": cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
    }
  })
}

// 关注博主 https://weibo.com/ajax/friendships/create friend_uid
export const followUser = async (friend_uid: string) => {
  const cookie = await getOrSetWeiboCookie() as string;
  const xsrf = cookie.match(/XSRF-TOKEN=(.*?);/)?.[1] ?? '';
  return await axios.post(`https://weibo.com/ajax/friendships/create`, {
    friend_uid: friend_uid+'',
      lpage: "homeRecom",
      page: "profile"
  },{
    headers: {
      "Cookie": cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      'X-Xsrf-Token': xsrf,
    }
  })
}
