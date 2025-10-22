/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-22 08:50:04
 * @LastEditTime: 2025-10-22 15:58:11
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\xhs.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
/* XHS API 封装（优化：回退使用 axios，并拆分请求头生成函数） */
import axios from "axios";
import * as vscode from "vscode";
import { setConfigByKey } from "../core/config";
import { getXhsSignature, XhsSignature } from "../utils/signature";

// 稳定序列化，确保签名与发送体 key 顺序一致（避免后端校验差异）
function stableStringify(value: any): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return "[" + value.map((v) => stableStringify(v)).join(",") + "]";
  const keys = Object.keys(value).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + stableStringify(value[k]))
      .join(",") +
    "}"
  );
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

// 构造请求体（稳定排序）
function buildRequestBody(body: any) {
  const bodyString = stableStringify(body);
  return { rawBody: body, bodyString, bodyObj: JSON.parse(bodyString) };
}

// 生成请求头（与签名解耦，方便复用 / 单测）
function buildXhsHeaders(params: {
  cookie: string;
  signObj: XhsSignature;
  host?: string;
}): Record<string, string> {
  const { cookie, signObj, host = "edith.xiaohongshu.com" } = params;
  return {
    Cookie: cookie,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Content-Type": "application/json;charset=UTF-8",
    "x-s": signObj.xs,
    "x-t": signObj.xt.toString(),
    authority: host,
    referer: "https://www.xiaohongshu.com/",
    accept: "application/json, text/plain, */*",
    origin: "https://www.xiaohongshu.com",
  };
}

export const getXhsFeed = async (cursor: string = "") => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  const apiPath = "/api/sns/web/v1/homefeed";
  const body = {
    cursor_score: cursor,
    num: 20,
    refresh_type: 1,
    note_index: 0,
    unread_begin_note_id: "",
    unread_end_note_id: "",
    unread_note_count: 0,
    category: "homefeed_recommend",
    search_key: "",
    need_num: 10,
    image_formats: ["jpg", "webp", "avif"],
    need_filter_image: false,
  };
  const { bodyString, bodyObj } = buildRequestBody(body);

  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(apiPath, bodyObj, cookie);
  } catch (e: any) {
    console.error("[xhs signature error]", e?.message || e);
    throw new Error("小红书签名生成失败，请检查 Cookie 或稍后再试");
  }

  const url = "https://edith.xiaohongshu.com" + apiPath;
  const headers = buildXhsHeaders({ cookie, signObj });

  try {
    const resp = await axios.post(url, bodyString, { headers, timeout: 10000 });
    console.log("[xhs response]", resp.data.data);
    return resp.data.data;
  } catch (err: any) {
    console.error("[xhs request error]", err);
    throw new Error("小红书请求异常，请检查网络或稍后再试");
  }
};
