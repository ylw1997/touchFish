/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-22 08:50:04
 * @LastEditTime: 2025-11-20 15:27:50
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\api\xhs.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
/* XHS API 封装（优化：回退使用 axios，并拆分请求头生成函数） */
import axios from "axios";
import xhsHttp from "../core/xhsHttp";
import { getOrSetCookie } from "../utils/apiUtils";
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
  return await getOrSetCookie("xhsCookie", "请输入小红书 Cookie");
};

// 构造请求体（稳定排序）
function buildRequestBody(body: any) {
  const bodyString = stableStringify(body);
  return { rawBody: body, bodyString, bodyObj: JSON.parse(bodyString) };
}

function buildGetPath(
  apiPath: string,
  query: Record<string, string | number | boolean | undefined | null>,
) {
  const entries = Object.entries(query);
  if (!entries.length) return apiPath;
  return (
    apiPath +
    "?" +
    entries
      .map(
        ([key, value]) =>
          `${key}=${value === undefined || value === null ? "" : String(value)}`,
      )
      .join("&")
  );
}

function buildGetUrl(pathWithQuery: string) {
  return `https://edith.xiaohongshu.com${pathWithQuery}`;
}

export function generateXB3TraceId(len = 16) {
  const chars = "abcdef0123456789";
  let x_b3_traceid = "";
  for (let i = 0; i < len; i++) {
    x_b3_traceid += chars[Math.floor(Math.random() * chars.length)];
  }
  return x_b3_traceid;
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
    xsecappid: "xhs-pc-web",
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
  const pathWithQuery = buildGetPath(apiPath, queryObj);
  // GET 签名：仍然对 query 进行稳定排序后签名
  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(pathWithQuery, "", cookie, "GET");
  } catch (e: any) {
    console.error("[xhs signature error]", e?.message || e);
    throw new Error("小红书签名生成失败，请检查 Cookie 或稍后再试");
  }
  const url = buildGetUrl(pathWithQuery);
  const headers = buildXhsHeaders({ cookie, signObj });
  const resp = await xhsHttp.get(url, { headers, timeout: 10000 });
  return resp.data?.data; // { comments, cursor, has_more, ... }
};

// 获取某条根评论的子评论列表
// 接口：/api/sns/web/v2/comment/sub/page?note_id={note_id}&root_comment_id={root_comment_id}&num=10&cursor={cursor}&image_formats=jpg,webp,avif&top_comment_id=&xsec_token={xsec_token}
// 说明：同主评论列表保持 GET + 签名策略；前端根据 sub_comment_has_more 决定是否触发。
export const getXhsSubComments = async (payload: {
  note_id: string;
  root_comment_id: string;
  cursor?: string;
  xsec_token: string;
}) => {
  if (!payload?.note_id) throw new Error("缺少笔记ID note_id");
  if (!payload?.root_comment_id)
    throw new Error("缺少根评论ID root_comment_id");
  if (!payload?.xsec_token) throw new Error("缺少 xsec_token 参数");
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  const apiPath = "/api/sns/web/v2/comment/sub/page";
  const queryObj = {
    note_id: payload.note_id,
    root_comment_id: payload.root_comment_id,
    num: 10,
    cursor: payload.cursor || "",
    image_formats: "jpg,webp,avif",
    top_comment_id: "",
    xsec_token: payload.xsec_token,
  };
  const pathWithQuery = buildGetPath(apiPath, queryObj);
  let signObj: XhsSignature;
  try {
    // GET 签名模式
    signObj = await getXhsSignature(pathWithQuery, "", cookie, "GET");
  } catch (e: any) {
    console.error("[xhs signature error sub comments]", e?.message || e);
    throw new Error("子评论签名生成失败，请稍后再试");
  }
  const url = buildGetUrl(pathWithQuery);
  const headers = buildXhsHeaders({ cookie, signObj });
  const resp = await xhsHttp.get(url, { headers, timeout: 10000 });
  // 后端实际返回字段为 comments 而非 sub_comments，这里做兼容转换
  const raw = resp.data?.data;
  if (!raw) return raw;
  // 标准化：返回 { sub_comments, cursor, has_more, ... }
  return {
    ...raw,
    sub_comments: raw.sub_comments || raw.comments || [],
  };
};

// 搜索笔记
// POST: /api/sns/web/v1/search/notes
// body: {
//   keyword, page, page_size, search_id, sort, note_type, ext_flags, geo, image_formats
// }
export const searchXhsNotes = async (params: {
  keyword: string;
  page?: number;
  search_id?: string;
}) => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  const apiPath = "/api/sns/web/v1/search/notes";
  const body = {
    keyword: params.keyword,
    page: params.page ?? 3,
    page_size: 20,
    search_id: params.search_id || generateXB3TraceId(),
    sort: "general",
    note_type: 0,
    ext_flags: [] as any[],
    geo: "",
    image_formats: ["jpg", "webp", "avif"],
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
  return resp.data?.data; // { items, has_more, ... }
};

// 获取当前登录用户信息
// GET https://edith.xiaohongshu.com/api/sns/web/v2/user/me
export const getXhsUserMe = async () => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  const apiPath = "/api/sns/web/v2/user/me";
  const queryObj = {};
  const pathWithQuery = buildGetPath(apiPath, queryObj);
  // GET 签名
  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(pathWithQuery, "", cookie, "GET");
  } catch (e: any) {
    throw new Error(`小红书签名生成失败: ${e?.message || "请检查 Cookie"}`);
  }
  const url = buildGetUrl(pathWithQuery);
  const headers = buildXhsHeaders({ cookie, signObj });
  const resp = await xhsHttp.get(url, { headers, timeout: 10000 });
  const data = resp.data?.data; // { nickname, images, red_id, user_id, desc, ... }
  if (!data) throw new Error("获取用户信息失败");
  return data;
};

// 获取用户已发布笔记列表
// 原始接口：GET /api/sns/web/v1/user_posted
// 示例参数：{
//   num: "30",
//   cursor: "68b69471000000001b01d7c9",
//   user_id: "5c4569a4000000000701a8de",
//   image_formats: "jpg,webp,avif",
//   xsec_token: "...",
//   xsec_source: "pc_feed"
// }
// 说明：与 getXhsComments 一致，依旧对 query 参数做稳定排序后参与签名，然后以 axios.get 方式请求。
export const getXhsUserPosted = async (params: {
  user_id: string;
  xsec_token: string;
  cursor: string;
  xsec_source?: string;
}) => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  const apiPath = "/api/sns/web/v1/user_posted";
  const queryObj = {
    num: "30",
    cursor: params.cursor,
    user_id: params.user_id,
    image_formats: "jpg,webp,avif",
    xsec_token: params.xsec_token,
    xsec_source: params.xsec_source || "pc_feed",
  };
  const pathWithQuery = buildGetPath(apiPath, queryObj);
  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(pathWithQuery, "", cookie, "GET");
  } catch (e: any) {
    throw new Error(`小红书签名生成失败: ${e?.message || "请检查 Cookie"}`);
  }
  const url = buildGetUrl(pathWithQuery);
  const headers = buildXhsHeaders({ cookie, signObj });
  // console.log("xhs user posted url:", url);
  const resp = await xhsHttp.get(url, { headers, timeout: 10000 });
  const raw = resp.data?.data; // 可能包含 notes 或 items
  const notes: any[] = raw?.notes || raw?.items || [];
  // 转换为与首页 feed 相同的结构，复用 XhsFeedCard 组件
  const items = notes.map((note: any) => {
    return {
      ignore: false,
      xsec_token: note.xsec_token,
      id: note.note_id || note.id,
      model_type: "note",
      track_id: "",
      note_card: {
        user: note.user,
        interact_info: note.interact_info,
        cover: note.cover,
        display_title: note.display_title || note.title,
        title: note.display_title || note.title,
        type: note.type,
        note_id: note.note_id || note.id,
        xsec_token: note.xsec_token,
      },
    };
  });
  return {
    items,
    cursor: raw?.cursor || "",
    has_more: raw?.has_more,
    // 保留原始结构供必要时调试
    _raw: raw,
  };
};

// 获取用户 hover card 信息
// 接口：GET /api/sns/web/v1/user/hover_card?target_user_id=xxx&image_formats=jpg,webp,avif&xsec_source=pc_comment&xsec_token=XXX
// 使用与评论/用户主页一致的 GET + 签名策略
export const getXhsUserHoverCard = async (params: {
  target_user_id: string;
  xsec_token: string;
  xsec_source?: string;
  image_formats?: string; // 'jpg,webp,avif'
}) => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  const apiPath = "/api/sns/web/v1/user/hover_card";
  const queryObj = {
    target_user_id: params.target_user_id,
    image_formats: params.image_formats || "jpg,webp,avif",
    xsec_source: params.xsec_source || "pc_feed",
    xsec_token: params.xsec_token,
  };
  const pathWithQuery = buildGetPath(apiPath, queryObj);
  let signObj: XhsSignature;
  try {
    // GET 签名模式
    signObj = await getXhsSignature(pathWithQuery, "", cookie, "GET");
  } catch (e: any) {
    console.error("[xhs signature error hover_card]", e?.message || e);
    throw new Error("小红书签名生成失败，请稍后再试");
  }
  const url = buildGetUrl(pathWithQuery);
  const headers = buildXhsHeaders({ cookie, signObj });
  const resp = await xhsHttp.get(url, { headers, timeout: 10000 });
  const data = resp.data?.data;
  return data; // { basic_info, interact_info, extraInfo_info, verify_info, ... }
};

// 关注用户
// POST https://edith.xiaohongshu.com/api/sns/web/v1/user/follow { target_user_id }
export const followXhsUser = async (params: { target_user_id: string }) => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  const apiPath = "/api/sns/web/v1/user/follow";
  const body = { target_user_id: params.target_user_id };
  const { bodyString, bodyObj } = buildRequestBody(body);
  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(apiPath, bodyObj, cookie);
  } catch (e: any) {
    console.error("[xhs signature error follow]", e?.message || e);
    throw new Error("关注签名失败，请稍后重试");
  }
  const url = "https://edith.xiaohongshu.com" + apiPath;
  const headers = buildXhsHeaders({ cookie, signObj });
  const resp = await xhsHttp.post(url, bodyString, { headers, timeout: 10000 });
  const data = resp.data?.data;
  if (!data) throw new Error("关注失败，返回数据为空");
  return data; // { fstatus: 'follows' }
};

// 取消关注用户
// POST https://edith.xiaohongshu.com/api/sns/web/v1/user/unfollow { target_user_id }
export const unfollowXhsUser = async (params: { target_user_id: string }) => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  const apiPath = "/api/sns/web/v1/user/unfollow";
  const body = { target_user_id: params.target_user_id };
  const { bodyString, bodyObj } = buildRequestBody(body);
  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(apiPath, bodyObj, cookie);
  } catch (e: any) {
    console.error("[xhs signature error unfollow]", e?.message || e);
    throw new Error("取消关注签名失败，请稍后重试");
  }
  const url = "https://edith.xiaohongshu.com" + apiPath;
  const headers = buildXhsHeaders({ cookie, signObj });
  const resp = await xhsHttp.post(url, bodyString, { headers, timeout: 10000 });
  const data = resp.data?.data;
  if (!data) throw new Error("取消关注失败，返回数据为空");
  return data; // { fstatus: 'none' }
};

// 点赞笔记
// POST https://edith.xiaohongshu.com/api/sns/web/v1/note/like { note_oid }
export const likeXhsNote = async (params: { note_oid: string }) => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  if (!params.note_oid) throw new Error("缺少 note_oid 参数");
  const apiPath = "/api/sns/web/v1/note/like";
  const body = { note_oid: params.note_oid };
  const { bodyString, bodyObj } = buildRequestBody(body);
  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(apiPath, bodyObj, cookie);
  } catch (e: any) {
    console.error("[xhs signature error like]", e?.message || e);
    throw new Error("点赞签名失败，请稍后重试");
  }
  const url = "https://edith.xiaohongshu.com" + apiPath;
  const headers = buildXhsHeaders({ cookie, signObj });
  const resp = await xhsHttp.post(url, bodyString, { headers, timeout: 10000 });
  const data = resp.data?.data;
  if (!data) throw new Error("点赞失败，返回数据为空");
  return data; // { new_like: true }
};

// 取消点赞笔记
// POST https://edith.xiaohongshu.com/api/sns/web/v1/note/dislike { note_oid }
export const dislikeXhsNote = async (params: { note_oid: string }) => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  if (!params.note_oid) throw new Error("缺少 note_oid 参数");
  const apiPath = "/api/sns/web/v1/note/dislike";
  const body = { note_oid: params.note_oid };
  const { bodyString, bodyObj } = buildRequestBody(body);
  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(apiPath, bodyObj, cookie);
  } catch (e: any) {
    console.error("[xhs signature error dislike]", e?.message || e);
    throw new Error("取消点赞签名失败，请稍后重试");
  }
  const url = "https://edith.xiaohongshu.com" + apiPath;
  const headers = buildXhsHeaders({ cookie, signObj });
  const resp = await xhsHttp.post(url, bodyString, { headers, timeout: 10000 });
  const data = resp.data?.data;
  if (!data) throw new Error("取消点赞失败，返回数据为空");
  return data; // { like_count: number }
};

// 收藏笔记
// POST https://edith.xiaohongshu.com/api/sns/web/v1/note/collect { note_id }
export const collectXhsNote = async (params: { note_id: string }) => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  if (!params.note_id) throw new Error("缺少 note_id 参数");
  const apiPath = "/api/sns/web/v1/note/collect";
  const body = { note_id: params.note_id };
  const { bodyString, bodyObj } = buildRequestBody(body);
  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(apiPath, bodyObj, cookie);
  } catch (e: any) {
    console.error("[xhs signature error collect]", e?.message || e);
    throw new Error("收藏签名失败，请稍后重试");
  }
  const url = "https://edith.xiaohongshu.com" + apiPath;
  const headers = buildXhsHeaders({ cookie, signObj });
  try {
    const resp = await xhsHttp.post(url, bodyString, {
      headers,
      timeout: 10000,
    });
    const data = resp.data;
    if (!data || !data.success) throw new Error(data?.msg || "收藏失败");
    return data; // { code: 0, success: true, msg: "成功" }
  } catch (error: any) {
    const responseData = error.response?.data;
    // 检查后端返回的错误信息
    if (responseData?.msg) {
      throw new Error(responseData.msg);
    }
    throw new Error(error.message || "收藏请求失败");
  }
};

// 取消收藏笔记
// POST https://edith.xiaohongshu.com/api/sns/web/v1/note/uncollect { note_ids }
export const uncollectXhsNote = async (params: { note_ids: string }) => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  if (!params.note_ids) throw new Error("缺少 note_ids 参数");
  const apiPath = "/api/sns/web/v1/note/uncollect";
  const body = { note_ids: params.note_ids };
  const { bodyString, bodyObj } = buildRequestBody(body);
  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(apiPath, bodyObj, cookie);
  } catch (e: any) {
    console.error("[xhs signature error uncollect]", e?.message || e);
    throw new Error("取消收藏签名失败，请稍后重试");
  }
  const url = "https://edith.xiaohongshu.com" + apiPath;
  const headers = buildXhsHeaders({ cookie, signObj });
  try {
    const resp = await xhsHttp.post(url, bodyString, {
      headers,
      timeout: 10000,
    });
    const data = resp.data;
    if (!data || !data.success) throw new Error(data?.msg || "取消收藏失败");
    return data; // { code: 0, success: true, msg: "成功" }
  } catch (error: any) {
    const responseData = error.response?.data;
    // 检查后端返回的错误信息
    if (responseData?.msg) {
      throw new Error(responseData.msg);
    }
    throw new Error(error.message || "取消收藏请求失败");
  }
};

// 发布评论
// POST https://edith.xiaohongshu.com/api/sns/web/v1/comment/post
// body: { note_id, content, at_users }
export const postXhsComment = async (params: {
  note_id: string;
  content: string;
  at_users?: any[];
}) => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");
  if (!params.note_id) throw new Error("缺少 note_id 参数");
  if (!params.content || !params.content.trim())
    throw new Error("评论内容不能为空");
  const apiPath = "/api/sns/web/v1/comment/post";
  const body = {
    note_id: params.note_id,
    content: params.content.trim(),
    at_users: params.at_users || [],
  };
  const { bodyString, bodyObj } = buildRequestBody(body);
  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(apiPath, bodyObj, cookie);
  } catch (e: any) {
    console.error("[xhs signature error post comment]", e?.message || e);
    throw new Error("评论签名失败，请稍后重试");
  }
  const url = "https://edith.xiaohongshu.com" + apiPath;
  const headers = buildXhsHeaders({ cookie, signObj });
  try {
    const resp = await xhsHttp.post(url, bodyString, {
      headers,
      timeout: 10000,
    });
    const data = resp.data;
    if (!data || !data.success) throw new Error(data?.msg || "发布评论失败");
    return data; // { code: 0, success: true, msg: "成功", data: { comment, time, toast } }
  } catch (error: any) {
    const responseData = error.response?.data;
    if (responseData?.msg) {
      throw new Error(responseData.msg);
    }
    throw new Error(error.message || "发布评论请求失败");
  }
};

// ==================== 图片上传相关 ====================

/**
 * 获取小红书图片上传许可
 * GET /api/media/v1/upload/creator/permit?biz_name=spectrum&scene=image&file_count=1&version=1&source=web
 * 参考 Spider_XHS 的 get_fileIds 方法
 */
export const getXhsUploadPermit = async (mediaType: string = "image") => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");

  const apiPath = "/api/media/v1/upload/creator/permit";

  // 参考 Spider_XHS 的 get_fileIds_params，按照原始顺序构造（不使用 buildGetPath 的遍历）
  // biz_name=spectrum&scene=image&file_count=1&version=1&source=web
  const scene = mediaType === "video" ? "video" : "image";
  const pathWithQuery = `${apiPath}?biz_name=spectrum&scene=${scene}&file_count=1&version=1&source=web`;

  // GET 请求签名
  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(pathWithQuery, "", cookie, "GET");
  } catch (e: any) {
    console.error("[xhs signature error upload permit]", e?.message || e);
    throw new Error("上传许可签名失败，请稍后重试");
  }

  const url = "https://creator.xiaohongshu.com" + pathWithQuery;
  const headers = buildXhsHeaders({
    cookie,
    signObj,
    host: "creator.xiaohongshu.com",
  });

  // 添加额外的必要 headers
  headers["Accept"] = "application/json, text/plain, */*";
  headers["Accept-Language"] = "zh-CN,zh;q=0.9";
  headers["Cache-Control"] = "no-cache";

  const resp = await xhsHttp.get(url, { headers, timeout: 10000 });
  const data = resp.data;

  if (!data || !data.success) {
    throw new Error(data?.msg || "获取上传许可失败");
  }

  // 解析返回数据
  // 返回结构: { result: { success: true }, uploadTempPermits: [{ fileIds: [...], token: ..., uploadAddr: ... }] }
  const uploadPermits = data.data?.uploadTempPermits;
  if (!uploadPermits || uploadPermits.length === 0) {
    throw new Error("获取上传许可失败: 没有可用的上传许可");
  }

  // 使用第一个上传许可（通常是 storageType=5 的那个）
  const permit = uploadPermits[0];
  if (!permit.fileIds || permit.fileIds.length === 0) {
    throw new Error("获取上传许可失败: 没有 fileId");
  }

  // 提取 fileId（去掉 spectrum/ 前缀）
  // Python: data['fileIds'][0].split('/')[-1]
  const fullFileId = permit.fileIds[0];
  const fileId = fullFileId.includes("/")
    ? fullFileId.split("/").pop()
    : fullFileId;

  return {
    fileId: fileId,
    fullFileId: fullFileId, // 保留完整的用于发布笔记
    token: permit.token,
    uploadAddr: permit.uploadAddr,
    expireTime: permit.expireTime,
  };
};

/**
 * 上传图片到小红书 OSS
 * PUT https://ros-upload.xiaohongshu.com/spectrum/{fileId}
 * 注意：OSS 上传不需要 Cookie 签名，但需要特殊的 headers
 */
export const uploadXhsImageToOss = async (
  fileId: string,
  imageBuffer: Buffer,
  fileName: string,
  mimeType: string,
  token?: string, // 从上传许可获取的 token
  uploadAddr?: string, // 上传地址，如 ros-upload.xiaohongshu.com
) => {
  // 使用指定的上传地址或默认地址
  const host = uploadAddr || "ros-upload.xiaohongshu.com";
  const uploadUrl = `https://${host}/spectrum/${fileId}`;

  // 构造上传 headers（参考 Spider_XHS 的 get_upload_media_headers）
  const headers: Record<string, string> = {
    "Content-Type": mimeType || "image/jpeg",
    "Content-Length": imageBuffer.length.toString(),
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    Referer: "https://creator.xiaohongshu.com/",
    Origin: "https://creator.xiaohongshu.com",
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Cache-Control": "no-cache",
  };

  // 如果有 token，添加到 header（参考 Spider_XHS）
  if (token) {
    headers["X-Cos-Security-Token"] = token;
  }

  // 使用原生 axios 而不是 xhsHttp，因为 OSS 上传不需要签名拦截
  const resp = await axios.put(uploadUrl, imageBuffer, {
    headers,
    timeout: 30000, // 上传超时时间更长
    validateStatus: (status) => status === 200 || status === 204, // OSS 可能返回 204
  });

  // OSS 上传成功返回 200 或 204，没有 response body
  if (resp.status !== 200 && resp.status !== 204) {
    throw new Error(`图片上传失败: ${resp.status}`);
  }

  // 构造图片 URL（参考小红书图片 URL 格式）
  const imageUrl = `https://sns-img-qc.xhscdn.com/${fileId}`;

  return {
    fileId,
    url: imageUrl,
  };
};

/**
 * 小红书图片上传完整流程
 * 1. 获取上传许可
 * 2. 上传到 OSS
 * 3. 返回图片 URL
 */
export const uploadXhsImage = async (params: {
  file: string; // base64 数据
  name: string;
  type: string;
}) => {
  const { file, name, type } = params;

  // 解析 base64
  const base64Data = file.replace(
    /^data:image\/(png|jpeg|jpg|webp);base64,/,
    "",
  );
  const imageBuffer = Buffer.from(base64Data, "base64");

  if (imageBuffer.length === 0) {
    throw new Error("图片数据为空");
  }

  // 1. 获取上传许可
  const permit = await getXhsUploadPermit("image");
  if (!permit || !permit.fileId) {
    throw new Error("获取上传许可失败: 返回数据为空");
  }

  // 2. 上传到 OSS（使用 uploadAddr 和 token）
  const ossResult = await uploadXhsImageToOss(
    permit.fileId,
    imageBuffer,
    name,
    type || "image/jpeg",
    permit.token,
    permit.uploadAddr,
  );

  return {
    fileId: permit.fileId, // 去掉前缀的，用于预览
    fullFileId: permit.fullFileId, // 完整的 spectrum/xxx，用于发布
    url: ossResult.url,
  };
};

// ==================== 发布笔记相关 ====================

/**
 * 发布小红书图片笔记
 * POST https://edith.xiaohongshu.com/web_api/sns/v2/note
 */
export const publishXhsNote = async (params: {
  title: string;
  desc: string;
  images: string[]; // 图片 fileId 或 URL 列表
}) => {
  const cookie = await getOrSetXhsCookie();
  if (!cookie) throw new Error("请先设置小红书 Cookie");

  const { title, desc, images } = params;

  if (!title || !title.trim()) {
    throw new Error("标题不能为空");
  }
  if (!desc || !desc.trim()) {
    throw new Error("正文不能为空");
  }
  if (!images || images.length === 0) {
    throw new Error("至少需要上传一张图片");
  }

  const apiPath = "/web_api/sns/v2/note";

  // 构造图片数据（参考浏览器真实请求）
  const imageList = images.map((img) => {
    // 使用完整的 file_id（包含 spectrum/ 前缀）
    const fileId = img.includes("/") ? img : `spectrum/${img}`;
    return {
      file_id: fileId,
      width: 1080,
      height: 1440,
      metadata: { source: -1 },
      stickers: { version: 2, floating: [] },
      extra_info_json: JSON.stringify({
        mimeType: "image/jpeg",
        image_metadata: { bg_color: "", origin_size: 0 },
      }),
    };
  });

  // 构造 source JSON（浏览器格式）
  const sourceObj = {
    type: "web",
    ids: "",
    extraInfo: JSON.stringify({ subType: "official", systemId: "web" }),
  };

  // 构造 business_binds JSON
  const businessBindsObj = {
    version: 1,
    noteId: 0,
    bizType: 0,
    noteOrderBind: {},
    notePostTiming: {},
    noteCollectionBind: { id: "" },
    noteSketchCollectionBind: { id: "" },
    coProduceBind: { enable: true },
    noteCopyBind: { copyable: true },
    interactionPermissionBind: { commentPermission: 0 },
    optionRelationList: [],
  };

  // 构造 capa_trace_info
  const capaTraceInfoObj = {
    contextJson: JSON.stringify({
      recommend_title: { recommend_title_id: "", is_use: 3, used_index: -1 },
      recommendTitle: [],
      recommend_topics: { used: [] },
    }),
  };

  // 构造请求体（完全参考浏览器请求格式）
  const body: any = {
    common: {
      type: "normal",
      note_id: "",
      source: JSON.stringify(sourceObj),
      title: title.trim(),
      desc: desc.trim(),
      ats: [],
      hash_tag: [],
      business_binds: JSON.stringify(businessBindsObj),
      privacy_info: {
        op_type: 1,
        type: 0,
        user_ids: [],
      },
      goods_info: {},
      biz_relations: [],
      capa_trace_info: capaTraceInfoObj,
    },
    image_info: {
      images: imageList,
    },
    video_info: null,
  };

  const { bodyString, bodyObj } = buildRequestBody(body);

  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(apiPath, bodyObj, cookie);
  } catch (e: any) {
    console.error("[xhs signature error publish note]", e?.message || e);
    throw new Error("发布签名失败，请稍后重试");
  }

  const url = "https://edith.xiaohongshu.com" + apiPath;
  const headers = buildXhsHeaders({ cookie, signObj });

  const resp = await xhsHttp.post(url, bodyString, {
    headers,
    timeout: 15000,
  });

  const data = resp.data;

  if (!data || !data.success) {
    throw new Error(data?.msg || "发布笔记失败");
  }

  return {
    success: true,
    note_id: data.data?.note_id,
    msg: "发布成功",
  };
};
