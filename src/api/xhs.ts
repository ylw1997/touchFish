/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-22 08:50:04
 * @LastEditTime: 2025-10-31 13:45:46
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\xhs.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
/* XHS API 封装（优化：回退使用 axios，并拆分请求头生成函数） */
import xhsHttp from "../core/xhsHttp";
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
    "x-s-common": signObj.xs_common,
    authority: host,
    referer: "https://www.xiaohongshu.com/",
    accept: "application/json, text/plain, */*",
    origin: "https://www.xiaohongshu.com",
  };
}
// 推荐
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
  const resp = await xhsHttp.post(url, bodyString, { headers, timeout: 10000 });
  // xhsHttp 拦截器会处理 success=false / code === -100 的提示与 Cookie 引导
  return resp.data?.data;
};

// 获取笔记详情（feed detail）
export const getXhsFeedDetail = async (payload: {
  source_note_id: string;
  image_formats?: string[];
  extra?: { need_body_topic?: string };
  xsec_source?: string;
  xsec_token: string;
}) => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  const apiPath = "/api/sns/web/v1/feed";
  const body = {
    extra: { need_body_topic: "1" },
    image_formats: ["jpg", "webp", "avif"],
    source_note_id: payload.source_note_id,
    xsec_source: "pc_feed",
    xsec_token: payload.xsec_token,
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
  const resp = await xhsHttp.post(url, bodyString, { headers, timeout: 10000 });
  // 直接返回原始 items[0] 给前端，由前端弹窗负责渲染（不在后端转换）
  return resp.data?.data?.items?.[0];
};

// 获取评论列表
// 接口：/api/sns/web/v2/comment/page?note_id=xxx&cursor=&top_comment_id=&image_formats=jpg,webp,avif&xsec_token=XXX
// 说明：原始请求为 GET，但为保持与其他签名请求一致并避免前端直连，这里改造成签名 POST：后端仍然接受 body 中的参数。
// 若后端以后严格限制必须 GET，可回退为 axios.get 并构造 headers。
export const getXhsComments = async (payload: {
  note_id: string;
  cursor?: string;
  xsec_token: string;
}) => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  const apiPath = "/api/sns/web/v2/comment/page";
  const queryObj = {
    note_id: payload.note_id,
    cursor: payload.cursor || "",
    top_comment_id: "",
    image_formats: "jpg,webp,avif",
    xsec_token: payload.xsec_token,
  };
  // GET 签名：仍然对 query 进行稳定排序后签名
  const { bodyObj } = buildRequestBody(queryObj);
  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(apiPath, bodyObj, cookie);
  } catch (e: any) {
    console.error("[xhs signature error]", e?.message || e);
    throw new Error("小红书签名生成失败，请检查 Cookie 或稍后再试");
  }
  const url = `https://edith.xiaohongshu.com${apiPath}?note_id=${payload.note_id}&cursor=${payload.cursor}&top_comment_id=&image_formats=jpg,webp,avif&xsec_token=${payload.xsec_token}`;
  const headers = buildXhsHeaders({ cookie, signObj });
  console.log("XHS GET COMMENTS URL28:", url, headers);
  const resp = await xhsHttp.get(url, { headers, timeout: 10000 });
  return resp.data?.data; // { comments, cursor, has_more, ... }
};
