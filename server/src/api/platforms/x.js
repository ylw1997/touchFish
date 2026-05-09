// X平台端点
const { fetchJson, readUpstreamJson } = require("../../upstream");
const { endpoint, p, getQuery, requireQuery, cookie } = require("../utils");
const { buildXCredential, buildXHeaders, getXTransactionId } = require("../../signers");

// 路由名称映射表
const routeNameMap = {
  "home-latest": "最新时间线",
  "search": "搜索推文",
  "user-info": "用户信息",
  "tweet-detail": "推文详情",
  "user-tweets": "用户推文",
  "following": "关注列表",
};

const xEndpoints = [
  // GraphQL 端点映射
  ...[
    ["home-latest", "HomeLatestTimeline", "eObmT5Nuapp04u8bYWf49Q", () => ({ count: 20, includePromotedContent: true, latestControlAvailable: true })],
    ["search", "SearchTimeline", "XN_HccZ9SU-miQVvwTAlFQ", (ctx) => ({ rawQuery: requireQuery(ctx.url, "query"), count: 20, querySource: "typed_query", product: getQuery(ctx.url, "product", "Top") }), [p("query", true, "OpenAI"), p("product", false, "Top")]],
    ["user-info", "UserByScreenName", "IGgvgiOx4QZndDHuD3x9TQ", (ctx) => ({ screen_name: requireQuery(ctx.url, "screenName") }), [p("screenName", true, "OpenAI")]],
    ["tweet-detail", "TweetDetail", "QrLp7AR-eMyamw8D1N9l6A", (ctx) => ({ focalTweetId: requireQuery(ctx.url, "tweetId"), with_rux_injections: false, rankingMode: "Relevance", includePromotedContent: true, withCommunity: true }), [p("tweetId", true, "")]],
    ["user-tweets", "UserTweets", "naBcZ4al-iTCFBYGOAMzBQ", (ctx) => ({ userId: requireQuery(ctx.url, "userId"), count: 20, includePromotedContent: true, withQuickPromoteEligibilityTweetFields: true, withVoice: true }), [p("userId", true, "")]],
    ["following", "Following", "lQxnNSmlJkQHod0yzbVYDg", (ctx) => ({ userId: requireQuery(ctx.url, "userId"), count: 20, includePromotedContent: false }), [p("userId", true, "")]],
  ].map(([route, operation, queryId, buildVariables, params = []]) =>
    endpoint({
      id: `x-${route}`,
      platformId: "x",
      name: routeNameMap[route] || route,
      path: `/api/x/${route}`,
      params,
      handler: async (ctx) => {
        const credential = buildXCredential({
          cookie: cookie(ctx.configStore, "xCookie"),
          authorization: cookie(ctx.configStore, "xAuthorization"),
        });
        const pathname = `/i/api/graphql/${queryId}/${operation}`;
        const tx = await getXTransactionId(pathname, "GET");
        const target = new URL(`https://x.com${pathname}`);
        target.searchParams.set("variables", JSON.stringify(buildVariables(ctx)));
        target.searchParams.set("features", JSON.stringify({
          responsive_web_graphql_timeline_navigation_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          responsive_web_edit_tweet_api_enabled: true,
          graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
          view_counts_everywhere_api_enabled: true,
          longform_notetweets_consumption_enabled: true,
        }));
        return fetchJson(ctx.fetchImpl, target.toString(), {
          headers: buildXHeaders(credential, { "x-client-transaction-id": tx }),
        });
      },
    }),
  ),

  // Home Latest Next
  endpoint({
    id: "x-home-latest-next",
    platformId: "x",
    name: "最新时间线下一页",
    path: "/api/x/home-latest-next",
    params: [p("cursor", false, "")],
    handler: async (ctx) => {
      const credential = buildXCredential({
        cookie: cookie(ctx.configStore, "xCookie"),
        authorization: cookie(ctx.configStore, "xAuthorization"),
      });
      const cursor = getQuery(ctx.url, "cursor", "");
      const pathname = "/i/api/graphql/eObmT5Nuapp04u8bYWf49Q/HomeLatestTimeline";
      const tx = await getXTransactionId(pathname, "GET");
      const target = new URL(`https://x.com${pathname}`);
      const variables = { count: 20, includePromotedContent: true, latestControlAvailable: true };
      if (cursor) variables.cursor = cursor;
      target.searchParams.set("variables", JSON.stringify(variables));
      target.searchParams.set("features", JSON.stringify({
        responsive_web_graphql_timeline_navigation_enabled: true,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      }));
      return fetchJson(ctx.fetchImpl, target.toString(), {
        headers: buildXHeaders(credential, { "x-client-transaction-id": tx }),
      });
    },
  }),

  // Home
  endpoint({
    id: "x-home",
    platformId: "x",
    name: "首页时间线",
    path: "/api/x/home",
    params: [p("cursor", false, "")],
    handler: async (ctx) => {
      const credential = buildXCredential({
        cookie: cookie(ctx.configStore, "xCookie"),
        authorization: cookie(ctx.configStore, "xAuthorization"),
      });
      const cursor = getQuery(ctx.url, "cursor", "");
      const pathname = "/i/api/graphql/1YVVV-B36P1Z3mE5gmj3w/HomeTimeline";
      const tx = await getXTransactionId(pathname, "GET");
      const target = new URL(`https://x.com${pathname}`);
      const variables = { count: 20, includePromotedContent: true };
      if (cursor) variables.cursor = cursor;
      target.searchParams.set("variables", JSON.stringify(variables));
      target.searchParams.set("features", JSON.stringify({
        responsive_web_graphql_timeline_navigation_enabled: true,
      }));
      return fetchJson(ctx.fetchImpl, target.toString(), {
        headers: buildXHeaders(credential, { "x-client-transaction-id": tx }),
      });
    },
  }),

  // Home Next
  endpoint({
    id: "x-home-next",
    platformId: "x",
    name: "首页时间线下一页",
    path: "/api/x/home-next",
    params: [p("cursor", true, "")],
    handler: async (ctx) => {
      const credential = buildXCredential({
        cookie: cookie(ctx.configStore, "xCookie"),
        authorization: cookie(ctx.configStore, "xAuthorization"),
      });
      const cursor = requireQuery(ctx.url, "cursor");
      const pathname = "/i/api/graphql/1YVVV-B36P1Z3mE5gmj3w/HomeTimeline";
      const tx = await getXTransactionId(pathname, "GET");
      const target = new URL(`https://x.com${pathname}`);
      target.searchParams.set("variables", JSON.stringify({ count: 20, cursor, includePromotedContent: true }));
      target.searchParams.set("features", JSON.stringify({
        responsive_web_graphql_timeline_navigation_enabled: true,
      }));
      return fetchJson(ctx.fetchImpl, target.toString(), {
        headers: buildXHeaders(credential, { "x-client-transaction-id": tx }),
      });
    },
  }),

  // Home Refresh
  endpoint({
    id: "x-home-refresh",
    platformId: "x",
    name: "刷新首页",
    path: "/api/x/home-refresh",
    handler: async (ctx) => {
      const credential = buildXCredential({
        cookie: cookie(ctx.configStore, "xCookie"),
        authorization: cookie(ctx.configStore, "xAuthorization"),
      });
      const pathname = "/i/api/graphql/1YVVV-B36P1Z3mE5gmj3w/HomeTimeline";
      const tx = await getXTransactionId(pathname, "GET");
      const target = new URL(`https://x.com${pathname}`);
      target.searchParams.set("variables", JSON.stringify({ count: 20, includePromotedContent: true }));
      target.searchParams.set("features", JSON.stringify({
        responsive_web_graphql_timeline_navigation_enabled: true,
      }));
      return fetchJson(ctx.fetchImpl, target.toString(), {
        headers: buildXHeaders(credential, { "x-client-transaction-id": tx }),
      });
    },
  }),

  // Follow
  endpoint({
    id: "x-follow",
    platformId: "x",
    name: "关注用户",
    method: "POST",
    path: "/api/x/follow",
    params: [p("userId", true, "")],
    handler: async (ctx) => {
      const credential = buildXCredential({
        cookie: cookie(ctx.configStore, "xCookie"),
        authorization: cookie(ctx.configStore, "xAuthorization"),
      });
      const userId = requireQuery(ctx.url, "userId");
      const pathname = "/i/api/1.1/friendships/create.json";
      const tx = await getXTransactionId(pathname, "POST");
      const target = new URL(`https://x.com${pathname}`);
      const response = await ctx.fetchImpl(target.toString(), {
        method: "POST",
        headers: buildXHeaders(credential, {
          "content-type": "application/x-www-form-urlencoded",
          "x-client-transaction-id": tx,
        }),
        body: new URLSearchParams({ user_id: userId }).toString(),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // Unfollow
  endpoint({
    id: "x-unfollow",
    platformId: "x",
    name: "取消关注",
    method: "POST",
    path: "/api/x/unfollow",
    params: [p("userId", true, "")],
    handler: async (ctx) => {
      const credential = buildXCredential({
        cookie: cookie(ctx.configStore, "xCookie"),
        authorization: cookie(ctx.configStore, "xAuthorization"),
      });
      const userId = requireQuery(ctx.url, "userId");
      const pathname = "/i/api/1.1/friendships/destroy.json";
      const tx = await getXTransactionId(pathname, "POST");
      const target = new URL(`https://x.com${pathname}`);
      const response = await ctx.fetchImpl(target.toString(), {
        method: "POST",
        headers: buildXHeaders(credential, {
          "content-type": "application/x-www-form-urlencoded",
          "x-client-transaction-id": tx,
        }),
        body: new URLSearchParams({ user_id: userId }).toString(),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // Translate
  endpoint({
    id: "x-translate",
    platformId: "x",
    name: "翻译推文",
    path: "/api/x/translate",
    params: [p("tweetId", true, ""), p("text", true, "")],
    handler: async (ctx) => {
      const credential = buildXCredential({
        cookie: cookie(ctx.configStore, "xCookie"),
        authorization: cookie(ctx.configStore, "xAuthorization"),
      });
      const tweetId = requireQuery(ctx.url, "tweetId");
      const text = requireQuery(ctx.url, "text");
      const pathname = "/i/api/1.1/strato/column/Translation/translation";
      const tx = await getXTransactionId(pathname, "GET");
      const target = new URL(`https://x.com${pathname}`);
      target.searchParams.set("variables", JSON.stringify({
        tweetId,
        text,
        destinationLanguage: "zh",
      }));
      return fetchJson(ctx.fetchImpl, target.toString(), {
        headers: buildXHeaders(credential, { "x-client-transaction-id": tx }),
      });
    },
  }),

  // Create Tweet
  endpoint({
    id: "x-create-tweet",
    platformId: "x",
    name: "发布推文",
    method: "POST",
    path: "/api/x/create-tweet",
    params: [p("text", true, ""), p("replyTo", false, "")],
    handler: async (ctx) => {
      const credential = buildXCredential({
        cookie: cookie(ctx.configStore, "xCookie"),
        authorization: cookie(ctx.configStore, "xAuthorization"),
      });
      const text = requireQuery(ctx.url, "text");
      const replyTo = getQuery(ctx.url, "replyTo", "");
      const pathname = "/i/api/2/tweets";
      const tx = await getXTransactionId(pathname, "POST");
      const body = {
        variables: {
          tweet_text: text,
          dark_request: false,
          semantic_annotation: [],
          ...(replyTo ? { reply: { in_reply_to_tweet_id: replyTo, exclude_reply_user_ids: [] } } : {}),
        },
        features: {
          responsive_web_edit_tweet_api_enabled: true,
          tweetypie_unmention_optimization_enabled: true,
          responsive_web_uc_gql_enabled: true,
        },
      };
      const response = await ctx.fetchImpl(`https://x.com${pathname}`, {
        method: "POST",
        headers: buildXHeaders(credential, {
          "content-type": "application/json",
          "x-client-transaction-id": tx,
        }),
        body: JSON.stringify(body),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // Repost
  endpoint({
    id: "x-repost",
    platformId: "x",
    name: "转发推文",
    method: "POST",
    path: "/api/x/repost",
    params: [p("tweetId", true, ""), p("text", false, "")],
    handler: async (ctx) => {
      const credential = buildXCredential({
        cookie: cookie(ctx.configStore, "xCookie"),
        authorization: cookie(ctx.configStore, "xAuthorization"),
      });
      const tweetId = requireQuery(ctx.url, "tweetId");
      const text = getQuery(ctx.url, "text", "");
      const pathname = "/i/api/2/tweets";
      const tx = await getXTransactionId(pathname, "POST");
      const body = {
        variables: {
          tweet_text: text,
          attachment_url: `https://x.com/i/web/status/${tweetId}`,
          dark_request: false,
        },
        features: {
          responsive_web_edit_tweet_api_enabled: true,
        },
      };
      const response = await ctx.fetchImpl(`https://x.com${pathname}`, {
        method: "POST",
        headers: buildXHeaders(credential, {
          "content-type": "application/json",
          "x-client-transaction-id": tx,
        }),
        body: JSON.stringify(body),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // Upload Media
  endpoint({
    id: "x-upload-media",
    platformId: "x",
    name: "上传媒体",
    method: "POST",
    path: "/api/x/upload-media",
    params: [p("mediaData", true, "base64..."), p("mediaType", false, "image")],
    handler: async (ctx) => {
      const credential = buildXCredential({
        cookie: cookie(ctx.configStore, "xCookie"),
        authorization: cookie(ctx.configStore, "xAuthorization"),
      });
      const mediaData = requireQuery(ctx.url, "mediaData");
      const mediaType = getQuery(ctx.url, "mediaType", "image");
      const buffer = Buffer.from(mediaData.replace(/^data:[^;]+;base64,/, ""), "base64");
      const form = new FormData();
      form.append("media", new Blob([buffer]), mediaType === "image" ? "image.jpg" : "video.mp4");
      const pathname = "/i/api/2/media/upload.json";
      const tx = await getXTransactionId(pathname, "POST");
      const response = await ctx.fetchImpl(`https://x.com${pathname}`, {
        method: "POST",
        headers: buildXHeaders(credential, { "x-client-transaction-id": tx }),
        body: form,
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // Verify Credentials
  endpoint({
    id: "x-verify-credentials",
    platformId: "x",
    name: "验证凭证",
    path: "/api/x/verify-credentials",
    handler: async (ctx) => {
      const credential = buildXCredential({
        cookie: cookie(ctx.configStore, "xCookie"),
        authorization: cookie(ctx.configStore, "xAuthorization"),
      });
      const pathname = "/i/api/1.1/account/verify_credentials.json";
      const tx = await getXTransactionId(pathname, "GET");
      const target = new URL(`https://x.com${pathname}`);
      return fetchJson(ctx.fetchImpl, target.toString(), {
        headers: buildXHeaders(credential, { "x-client-transaction-id": tx }),
      });
    },
  }),

  // Favorite
  endpoint({
    id: "x-favorite",
    platformId: "x",
    name: "收藏推文",
    method: "POST",
    path: "/api/x/favorite",
    params: [p("tweetId", true, "")],
    handler: async (ctx) => {
      const credential = buildXCredential({
        cookie: cookie(ctx.configStore, "xCookie"),
        authorization: cookie(ctx.configStore, "xAuthorization"),
      });
      const tweetId = requireQuery(ctx.url, "tweetId");
      const pathname = "/i/api/2/favorites/create.json";
      const tx = await getXTransactionId(pathname, "POST");
      const target = new URL(`https://x.com${pathname}`);
      const response = await ctx.fetchImpl(target.toString(), {
        method: "POST",
        headers: buildXHeaders(credential, {
          "content-type": "application/x-www-form-urlencoded",
          "x-client-transaction-id": tx,
        }),
        body: new URLSearchParams({ tweet_id: tweetId }).toString(),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),

  // Unfavorite
  endpoint({
    id: "x-unfavorite",
    platformId: "x",
    name: "unfavorite",
    method: "POST",
    path: "/api/x/unfavorite",
    params: [p("tweetId", true, "")],
    handler: async (ctx) => {
      const credential = buildXCredential({
        cookie: cookie(ctx.configStore, "xCookie"),
        authorization: cookie(ctx.configStore, "xAuthorization"),
      });
      const tweetId = requireQuery(ctx.url, "tweetId");
      const pathname = "/i/api/2/favorites/destroy.json";
      const tx = await getXTransactionId(pathname, "POST");
      const target = new URL(`https://x.com${pathname}`);
      const response = await ctx.fetchImpl(target.toString(), {
        method: "POST",
        headers: buildXHeaders(credential, {
          "content-type": "application/x-www-form-urlencoded",
          "x-client-transaction-id": tx,
        }),
        body: new URLSearchParams({ tweet_id: tweetId }).toString(),
      });
      const data = await readUpstreamJson(response);
      return { ok: response.ok, status: response.status, data };
    },
  }),
];

module.exports = { xEndpoints };
