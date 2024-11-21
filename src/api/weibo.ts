/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-19 13:54:53
 * @LastEditTime: 2024-11-21 11:07:02
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\weibo.ts
 * Copyright (c) 2024 by yangliwei, All Rights Reserved. 
 * @Description: 
 */
import axios from "axios";
import * as vscode from 'vscode';
import { setConfigByKey } from "../config";

export const getOrSetZhihuCookie = async () => {
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

export const getWeiboData = async (url:string) => {
  const cookie = await getOrSetZhihuCookie() as string;
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