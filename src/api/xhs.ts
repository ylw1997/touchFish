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
  if (!payload?.root_comment_id) throw new Error("缺少根评论ID root_comment_id");
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
  let signObj: XhsSignature;
  try {
    // GET 签名模式
    signObj = await getXhsSignature(apiPath, queryObj, cookie, "GET");
  } catch (e: any) {
    console.error("[xhs signature error sub comments]", e?.message || e);
    throw new Error("子评论签名生成失败，请稍后再试");
  }
  const safeToken = queryObj.xsec_token.replace(/=/g, "%3D");
  const url = `https://edith.xiaohongshu.com${apiPath}?note_id=${queryObj.note_id}&root_comment_id=${queryObj.root_comment_id}&num=${queryObj.num}&cursor=${queryObj.cursor}&image_formats=${queryObj.image_formats}&top_comment_id=&xsec_token=${safeToken}`;
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
  let signObj: XhsSignature;
  try {
    signObj = await getXhsSignature(apiPath, queryObj, cookie, "GET");
  } catch (e: any) {
    throw new Error(`小红书签名生成失败: ${e?.message || '请检查 Cookie'}`);
  }
  const xsecToken = queryObj.xsec_token.replace(/=/g, "%3D");
  const url = `https://edith.xiaohongshu.com${apiPath}?num=30&cursor=${queryObj.cursor}&user_id=${queryObj.user_id}&image_formats=jpg,webp,avif&xsec_token=${xsecToken}&xsec_source=${queryObj.xsec_source}`;
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
  let signObj: XhsSignature;
  try {
    // GET 签名模式
    signObj = await getXhsSignature(apiPath, queryObj, cookie, "GET");
  } catch (e: any) {
    console.error("[xhs signature error hover_card]", e?.message || e);
    throw new Error("小红书签名生成失败，请稍后再试");
  }
  const safeToken = queryObj.xsec_token.replace(/=/g, "%3D");
  const url = `https://edith.xiaohongshu.com${apiPath}?target_user_id=${queryObj.target_user_id}&image_formats=${queryObj.image_formats}&xsec_source=${queryObj.xsec_source}&xsec_token=${safeToken}`;
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
