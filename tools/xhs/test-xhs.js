/* eslint-disable */
const path = require("path");
const axios = require("axios");

function parseA1(cookie) {
  const match = (cookie || "").match(/(?:^|;\s*)a1=([^;]+)/);
  return match ? match[1] : "";
}

function buildGetPath(apiPath, query) {
  const entries = Object.entries(query || {});
  if (!entries.length) return apiPath;
  return (
    apiPath +
    "?" +
    entries
      .map(([key, value]) => `${key}=${value === undefined || value === null ? "" : String(value)}`)
      .join("&")
  );
}

function getRawModulePath() {
  return path.resolve(__dirname, "../../src/utils/xhs.raw.js");
}

function loadSigner() {
  const rawPath = getRawModulePath();
  const signer = require(rawPath);
  if (!signer || typeof signer.get_request_headers_params !== "function") {
    throw new Error(`Invalid xhs.raw.js export at ${rawPath}`);
  }
  return { rawPath, signer };
}

function createHeaders(cookie, signObj) {
  return {
    Cookie: cookie,
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Content-Type": "application/json;charset=UTF-8",
    "x-s": signObj.xs,
    "x-t": String(signObj.xt),
    "x-s-common": signObj.xs_common,
    xsecappid: "xhs-pc-web",
    authority: "edith.xiaohongshu.com",
    referer: "https://www.xiaohongshu.com/",
    accept: "application/json, text/plain, */*",
    origin: "https://www.xiaohongshu.com",
  };
}

function signPost(signer, apiPath, payload, cookie) {
  return signer.get_request_headers_params(apiPath, payload, parseA1(cookie), "POST");
}

function signGet(signer, apiPath, query, cookie) {
  const pathWithQuery = buildGetPath(apiPath, query);
  const signObj = signer.get_request_headers_params(pathWithQuery, "", parseA1(cookie), "GET");
  return { pathWithQuery, signObj };
}

async function requestHomefeed(signer, cookie) {
  const apiPath = "/api/sns/web/v1/homefeed";
  const body = {
    cursor_score: "",
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
  const signObj = signPost(signer, apiPath, body, cookie);
  const resp = await axios.post(`https://edith.xiaohongshu.com${apiPath}`, JSON.stringify(body), {
    headers: createHeaders(cookie, signObj),
    timeout: 15000,
  });
  return resp.data;
}

function pickSampleFromHomefeed(homeData) {
  const items = (((homeData || {}).data || {}).items) || [];
  for (const item of items) {
    const noteCard = item.note_card || {};
    const user = noteCard.user || {};
    const noteId = noteCard.note_id || item.note_id || item.id;
    const xsecToken = noteCard.xsec_token || item.xsec_token;
    const userId = user.user_id || noteCard.user_id || item.user_id;
    if (noteId && xsecToken && userId) {
      return { noteId, xsecToken, userId, itemsCount: items.length };
    }
  }
  return { itemsCount: items.length };
}

async function requestComments(signer, cookie, noteId, xsecToken) {
  const apiPath = "/api/sns/web/v2/comment/page";
  const query = {
    note_id: noteId,
    cursor: "",
    top_comment_id: "",
    image_formats: "jpg,webp,avif",
    xsec_token: xsecToken,
  };
  const { pathWithQuery, signObj } = signGet(signer, apiPath, query, cookie);
  const resp = await axios.get(`https://edith.xiaohongshu.com${pathWithQuery}`, {
    headers: createHeaders(cookie, signObj),
    timeout: 15000,
  });
  return { pathWithQuery, data: resp.data };
}

async function requestUserPosted(signer, cookie, userId, xsecToken, cursor) {
  const apiPath = "/api/sns/web/v1/user_posted";
  const query = {
    num: "30",
    cursor: cursor || "",
    user_id: userId,
    image_formats: "jpg,webp,avif",
    xsec_token: xsecToken,
    xsec_source: "pc_feed",
  };
  const { pathWithQuery, signObj } = signGet(signer, apiPath, query, cookie);
  const resp = await axios.get(`https://edith.xiaohongshu.com${pathWithQuery}`, {
    headers: createHeaders(cookie, signObj),
    timeout: 15000,
  });
  return { pathWithQuery, data: resp.data };
}

function printJson(title, payload) {
  console.log(`\n[${title}]`);
  console.log(JSON.stringify(payload, null, 2));
}

async function run() {
  const { rawPath, signer } = loadSigner();
  const cookie = process.env.XHS_COOKIE || "";

  printJson("signer", {
    rawPath,
    hasExport: typeof signer.get_request_headers_params === "function",
  });

  const samplePost = signPost(
    signer,
    "/api/sns/web/v1/homefeed",
    {
      cursor_score: "",
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
    },
    cookie
  );

  const sampleGet = signGet(
    signer,
    "/api/sns/web/v2/comment/page",
    {
      note_id: "demo",
      cursor: "",
      top_comment_id: "",
      image_formats: "jpg,webp,avif",
      xsec_token: "demo",
    },
    cookie
  );

  printJson("sample-post-sign", {
    xsLength: samplePost.xs?.length || 0,
    xt: String(samplePost.xt || ""),
    xsCommonLength: samplePost.xs_common?.length || 0,
  });

  printJson("sample-get-sign", {
    pathWithQuery: sampleGet.pathWithQuery,
    xsLength: sampleGet.signObj.xs?.length || 0,
    xt: String(sampleGet.signObj.xt || ""),
    xsCommonLength: sampleGet.signObj.xs_common?.length || 0,
  });

  if (!cookie) {
    console.log("\n[skip-live]");
    console.log("No XHS_COOKIE provided. Local signer smoke test finished.");
    return;
  }

  const home = await requestHomefeed(signer, cookie);
  const sample = pickSampleFromHomefeed(home);
  printJson("homefeed", {
    success: home?.success,
    code: home?.code,
    msg: home?.msg || home?.resp_msg || null,
    itemsCount: sample.itemsCount || 0,
  });

  const noteId = process.env.XHS_NOTE_ID || sample.noteId;
  const xsecToken = process.env.XHS_XSEC_TOKEN || sample.xsecToken;
  const userId = process.env.XHS_USER_ID || sample.userId;
  const cursor = process.env.XHS_CURSOR || "";

  printJson("sample-target", {
    noteId: noteId || null,
    userId: userId || null,
    xsecTokenLength: xsecToken ? xsecToken.length : 0,
  });

  if (noteId && xsecToken) {
    const comments = await requestComments(signer, cookie, noteId, xsecToken);
    printJson("comments", {
      pathWithQuery: comments.pathWithQuery,
      success: comments.data?.success,
      code: comments.data?.code,
      msg: comments.data?.msg || comments.data?.resp_msg || null,
      count: (((comments.data || {}).data || {}).comments || []).length,
    });
  } else {
    printJson("comments", { skipped: true, reason: "missing noteId/xsecToken" });
  }

  if (userId && xsecToken) {
    const posted = await requestUserPosted(signer, cookie, userId, xsecToken, cursor);
    printJson("user-posted", {
      pathWithQuery: posted.pathWithQuery,
      success: posted.data?.success,
      code: posted.data?.code,
      msg: posted.data?.msg || posted.data?.resp_msg || null,
      count: (((posted.data || {}).data || {}).notes || []).length,
    });
  } else {
    printJson("user-posted", { skipped: true, reason: "missing userId/xsecToken" });
  }
}

run().catch((error) => {
  console.error("\n[xhs-test-error]");
  console.error(error?.response?.status ? `status=${error.response.status}` : "");
  if (error?.response?.data) {
    console.error(JSON.stringify(error.response.data, null, 2));
  } else {
    console.error(error?.stack || error?.message || String(error));
  }
  process.exit(1);
});
