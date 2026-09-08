/* eslint-disable */
const path = require("path");
const axios = require("axios");

function getSigner() {
  const signerPath = path.resolve(__dirname, "../../out/src/utils/signature/xhsSigner.js");
  try {
    return require(signerPath);
  } catch (err) {
    throw new Error(
      `Failed to load compiled signature module from ${signerPath}.\nPlease run "pnpm compile-tests" first.\n${err.message}`
    );
  }
}

function parseA1(cookie) {
  const match = (cookie || "").match(/(?:^|;\s*)a1=([^;]+)/);
  return match ? match[1] : "test_a1_demo_token";
}

function buildGetPath(apiPath, query) {
  const entries = Object.entries(query || {});
  if (!entries.length) return apiPath;
  return (
    apiPath +
    "?" +
    entries
      .map(([key, value]) => `${key}=${value === undefined || value === null ? "" : encodeURIComponent(String(value))}`)
      .join("&")
  );
}

function createHeaders(cookie, signObj) {
  const headers = {
    Cookie: cookie || "a1=test_a1_demo_token",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
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
  if (signObj.x_b3_traceid) headers["x-b3-traceid"] = signObj.x_b3_traceid;
  if (signObj.x_xray_traceid) headers["x-xray-traceid"] = signObj.x_xray_traceid;
  if (signObj.x_rap_param) headers["x-rap-param"] = signObj.x_rap_param;
  if (signObj.xy_direction) headers["xy-direction"] = signObj.xy_direction;
  return headers;
}

const XS_ALPHABET = "ZmserbBoHQtNP+wOcza/LpngG8yJq42KWYj0DSfdikx3VT16IlUAFM97hECvuRX5";
function decodeXsCustomBase64(text) {
  const rev = Object.fromEntries(Array.from(XS_ALPHABET).map((c, i) => [c, i]));
  const bytes = [];
  for (let i = 0; i < text.length; i += 4) {
    const b0 = rev[text[i]],
      b1 = rev[text[i + 1]],
      b2 = rev[text[i + 2]],
      b3 = rev[text[i + 3]];
    bytes.push((b0 << 2) | (b1 >> 4));
    if (text[i + 2] !== "=") bytes.push(((b1 & 15) << 4) | (b2 >> 2));
    if (text[i + 3] !== "=") bytes.push(((b2 & 3) << 6) | b3);
  }
  return decodeURIComponent(bytes.map((b) => "%" + b.toString(16).padStart(2, "0")).join(""));
}

function printJson(title, payload) {
  console.log(`\n[${title}]`);
  console.log(JSON.stringify(payload, null, 2));
}

async function run() {
  console.log("=== 小红书新签名算法校验测试 ===");

  const signer = getSigner();
  const cookie = process.env.XHS_COOKIE || "";

  // 1. 测试 POST 签名 (带 RAP 白名单接口)
  const homefeedBody = {
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

  const samplePost = await signer.getXhsSignature(
    "/api/sns/web/v1/homefeed",
    homefeedBody,
    cookie || "a1=test_a1_demo_token; webBuild=6.47.2",
    "POST",
    "test_user_id"
  );

  printJson("sample-post-homefeed", {
    xsLength: samplePost.xs?.length || 0,
    xsPrefix: samplePost.xs?.slice(0, 10),
    xt: String(samplePost.xt || ""),
    xsCommonLength: samplePost.xs_common?.length || 0,
    hasRapParam: Boolean(samplePost.x_rap_param),
    rapPrefix: samplePost.x_rap_param?.slice(0, 8),
    b3TraceId: samplePost.x_b3_traceid,
    xrayTraceId: samplePost.x_xray_traceid,
    xyDirection: samplePost.xy_direction,
  });

  // 解包断言验证
  const xsPayload = JSON.parse(decodeXsCustomBase64(samplePost.xs.replace(/^XYS_/, "")));
  const xsCommonPayload = JSON.parse(decodeXsCustomBase64(samplePost.xs_common));

  printJson("decoded-xs-verification", {
    x0_version: xsPayload.x0,
    x1_appId: xsPayload.x1,
    x2_platform: xsPayload.x2,
    x3_tier_prefix: xsPayload.x3?.slice(0, 12),
    x4_type: xsPayload.x4,
    x5_md5_full_length: xsPayload.x5?.length,
  });

  printJson("decoded-xs-common-verification", {
    s0: xsCommonPayload.s0,
    x0_b1b1: xsCommonPayload.x0,
    x1_version: xsCommonPayload.x1,
    x3_appId: xsCommonPayload.x3,
    x4_webBuild: xsCommonPayload.x4,
    x5_a1: xsCommonPayload.x5,
    has_x8_b1: Boolean(xsCommonPayload.x8),
    x8_b1_len: xsCommonPayload.x8?.length || 0,
    x9_gens9: xsCommonPayload.x9,
    x12_dslPair: xsCommonPayload.x12,
  });

  // 严格断言
  if (!samplePost.xs.startsWith("XYS_")) throw new Error("x-s must start with XYS_");
  if (!xsPayload.x3.startsWith("mns0301_")) throw new Error("x3 must start with mns0301_");
  if (xsPayload.x0 !== "4.4.3") throw new Error("x0 version must be 4.4.3");
  if (!xsCommonPayload.x12 || !xsCommonPayload.x12.includes(";")) throw new Error("x12 dslPair invalid");
  if (!samplePost.x_rap_param?.startsWith("ByQ")) throw new Error("x-rap-param must start with ByQ");

  console.log("\n[SUCCESS] 本地所有签名算法断言全部通过！");

  // 2. 如果提供了 XHS_COOKIE，则进行真实网络请求验证
  if (!cookie) {
    console.log("\n[INFO] 未提供 XHS_COOKIE 环境变量，跳过在线接口请求测试。");
    console.log("提示：如需测试真实接口，可执行：$env:XHS_COOKIE='你的cookie'; pnpm xhs:test");
    return;
  }

  console.log("\n[LIVE] 检测到 XHS_COOKIE，开始真实网络接口连通性测试...");
  try {
    const apiPath = "/api/sns/web/v1/homefeed";
    const headers = createHeaders(cookie, samplePost);
    const resp = await axios.post(`https://edith.xiaohongshu.com${apiPath}`, JSON.stringify(homefeedBody), {
      headers,
      timeout: 15000,
    });
    const items = resp.data?.data?.items || [];
    printJson("live-homefeed-response", {
      status: resp.status,
      success: resp.data?.success,
      code: resp.data?.code,
      msg: resp.data?.msg || null,
      itemsCount: items.length,
    });

    if (items.length > 0) {
      let sampleNote = null;
      for (const item of items) {
        const noteCard = item.note_card || {};
        const user = noteCard.user || {};
        const noteId = noteCard.note_id || item.id;
        const xsecToken = noteCard.xsec_token || item.xsec_token;
        const userId = user.user_id || noteCard.user_id;
        if (noteId && xsecToken) {
          sampleNote = { noteId, xsecToken, userId, title: noteCard.display_title };
          break;
        }
      }

      if (sampleNote) {
        printJson("sample-note-found", sampleNote);

        // 测试评论 GET
        const commentPath = "/api/sns/web/v2/comment/page";
        const commentQuery = {
          note_id: sampleNote.noteId,
          cursor: "",
          top_comment_id: "",
          image_formats: "jpg,webp,avif",
          xsec_token: sampleNote.xsecToken,
        };
        const commentUrl = buildGetPath(commentPath, commentQuery);
        const commentSign = await signer.getXhsSignature(commentUrl, "", cookie, "GET");
        const commentHeaders = createHeaders(cookie, commentSign);
        const commentResp = await axios.get(`https://edith.xiaohongshu.com${commentUrl}`, {
          headers: commentHeaders,
          timeout: 15000,
        });
        printJson("live-comment-response", {
          success: commentResp.data?.success,
          code: commentResp.data?.code,
          msg: commentResp.data?.msg || null,
          commentCount: (commentResp.data?.data?.comments || []).length,
        });

        // 测试用户笔记列表 GET
        if (sampleNote.userId) {
          const userPath = "/api/sns/web/v1/user_posted";
          const userQuery = {
            num: "30",
            cursor: "",
            user_id: sampleNote.userId,
            image_formats: "jpg,webp,avif",
            xsec_token: sampleNote.xsecToken,
            xsec_source: "pc_feed",
          };
          const userUrl = buildGetPath(userPath, userQuery);
          const userSign = await signer.getXhsSignature(userUrl, "", cookie, "GET");
          const userHeaders = createHeaders(cookie, userSign);
          const userResp = await axios.get(`https://edith.xiaohongshu.com${userUrl}`, {
            headers: userHeaders,
            timeout: 15000,
          });
          printJson("live-user-posted-response", {
            success: userResp.data?.success,
            code: userResp.data?.code,
            msg: userResp.data?.msg || null,
            noteCount: (userResp.data?.data?.notes || []).length,
          });
        }
      }
    }
  } catch (error) {
    console.error("[live-request-error]", error?.response?.data || error?.message || error);
  }
}

run().catch((err) => {
  console.error("\n[TEST FAILED]:", err.message || err);
  process.exit(1);
});
