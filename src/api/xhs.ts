/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-22 08:50:04
 * @LastEditTime: 2025-10-22 15:33:25
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\xhs.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
/* XHS API 封装 (已改为 fetch) */
// 移除 axios，使用 Node18+ 原生 fetch；若低版本 Node 需在外层添加 polyfill
// import axios from "axios"; // 已废弃
import * as vscode from "vscode";
import { setConfigByKey } from "../core/config";
// 使用统一签名工具，参考 zhihu 实现方式
import { getXhsSignature } from "../utils/signature";

// 稳定序列化，确保签名与发送体 key 顺序一致（避免后端校验差异）
function stableStringify(value: any): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(v => stableStringify(v)).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

export interface XhsFeedItemBrief {
  id?: string;
  title?: string;
  cover?: string;
  user?: string;
  liked_count?: number;
  comment_count?: number;
  type?: string; // normal | video | other
  video_duration?: number;
  raw?: any;
}

export interface XhsFeedResponse {
  items: XhsFeedItemBrief[];
  cursor: string;
  has_more: boolean;
}

export const getOrSetXhsCookie = async (): Promise<string | undefined> => {
  const config = vscode.workspace.getConfiguration("touchfish");
  let cookie = config.get("xhsCookie") as string | undefined;
  if (!cookie) {
    cookie = await vscode.window.showInputBox({
      prompt: "请输入小红书 Cookie",
      placeHolder: "请输入小红书 Cookie",
    });
    if (cookie) await setConfigByKey("xhsCookie", cookie);
  }
  return cookie;
};

export const getXhsFeed = async (
  cursor: string = ""
): Promise<XhsFeedResponse> => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  const apiPath = "/api/sns/web/v1/homefeed";
  const rawBody = {"cursor_score":cursor,"num":20,"refresh_type":1,"note_index":0,"unread_begin_note_id":"","unread_end_note_id":"","unread_note_count":0,"category":"homefeed_recommend","search_key":"","need_num":10,"image_formats":["jpg","webp","avif"],"need_filter_image":false};
  // 生成稳定序列化副本用于签名与发送
  const bodyString = stableStringify(rawBody);
  const body = JSON.parse(bodyString);
  // 统一调用 getXhsSignature 生成签名，内部已带回退逻辑
  let signObj;
  try {
    // 传入真实 Cookie 以便解析 a1 并生成匹配的签名与 X-s-common
    signObj = await getXhsSignature(apiPath, body, cookie);
  } catch (e: any) {
    console.error('[xhs signature error]', e?.message || e);
    throw new Error('小红书签名生成失败，请检查 Cookie 或稍后再试');
  }
  // 使用 edith 子域，与浏览器实际请求一致，避免网关内部转发失败
  const url = "https://edith.xiaohongshu.com" + apiPath;
  const headers: Record<string,string> = {
    "Cookie": cookie,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Content-Type": "application/json;charset=UTF-8",
    "x-s": signObj.xs,
    "x-t": signObj.xt,
    authority: "edith.xiaohongshu.com",
    referer: "https://www.xiaohongshu.com/",
    accept: "application/json, text/plain, */*",
    origin: "https://www.xiaohongshu.com",
  };
  let json: any;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: headers as any,
      body: bodyString,
    });
    
    const text = await resp.text();
    // 尝试解析 JSON，保留原始文本方便诊断
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`响应非 JSON 格式(HTTP ${resp.status}): ${text?.slice(0,200)}`);
    }
    if (!resp.ok) {
      // 服务端 4xx/5xx
      const serverMsg = json?.msg || json?.message || text?.slice(0,120);
      throw new Error(`小红书接口失败 (HTTP ${resp.status}): ${serverMsg || '未知错误'}`);
    }
  } catch (err: any) {
    throw new Error(`小红书请求异常: ${err?.message || err}`);
  }
  if (json && typeof json === 'object') {
    const ok = json.ok;
    const msg = json.msg;
    if (ok === 0) {
      throw new Error(`小红书接口返回错误(ok=0): ${msg || '未知错误'}，可能是签名或 Cookie 失效，请重新获取。`);
    }
  }
  const dataRoot = json?.data || json;
  return {
    ...dataRoot
  };
};
