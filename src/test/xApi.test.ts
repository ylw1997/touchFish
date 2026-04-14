import * as assert from "assert";
import { describe, it } from "mocha";

import {
  X_TWEET_DETAIL_QUERY_ID,
  X_HOME_TIMELINE_QUERY_ID,
  X_SEARCH_TIMELINE_QUERY_ID,
  X_USER_BY_SCREEN_NAME_QUERY_ID,
  X_USER_TWEETS_QUERY_ID,
  buildXHeaders,
  getHomeTimeline,
  getHomeTimelineNext,
  getHomeLatestTimeline,
  getHomeLatestTimelineNext,
  getTweetDetail,
  getXSearchTimeline,
  getXUserInfo,
  getXUserTweets,
  setGlobalXCredential,
  xHttp,
} from "../api/x";

describe("x api helpers", () => {
  it("builds timeline headers with auth, cookie and csrf token", () => {
    const headers = buildXHeaders({
      cookie: "auth_token=test; ct0=csrf-token",
      authorization: "Bearer test-token",
      csrfToken: "csrf-token",
    });

    assert.equal(headers.authorization, "Bearer test-token");
    assert.equal(headers.Cookie, "auth_token=test; ct0=csrf-token");
    assert.equal(headers["x-csrf-token"], "csrf-token");
    assert.equal(headers["x-twitter-active-user"], "yes");
    assert.equal(headers["x-twitter-auth-type"], "OAuth2Session");
    assert.equal(headers.Referer, "https://x.com/home");
  });

  it("requests launch timeline with GET query parameters", async () => {
    const originalGet = xHttp.get;

    xHttp.get = (async (url: string, config?: any) => {
      assert.ok(String(url).includes(`/i/api/graphql/${X_HOME_TIMELINE_QUERY_ID}/HomeTimeline`));
      assert.equal(config?.headers?.authorization, "Bearer test-token");
      assert.equal(config?.headers?.["x-csrf-token"], "csrf-token");
      assert.equal(config?.params?.variables.count, 20);
      assert.equal(config?.params?.variables.requestContext, "launch");
      assert.equal(config?.params?.variables.includePromotedContent, true);
      assert.equal(config?.params?.variables.withCommunity, true);
      assert.equal(config?.params?.features.responsive_web_graphql_timeline_navigation_enabled, true);
      return {
        data: {
          data: {
            home: {
              home_timeline_urt: {
                instructions: [],
              },
            },
          },
        },
      } as any;
    }) as typeof xHttp.get;

    try {
      const result = await getHomeTimeline(
        {
          cookie: "auth_token=test; ct0=csrf-token",
          authorization: "Bearer test-token",
          csrfToken: "csrf-token",
        },
        20,
      );

      assert.equal(result.code, 0);
      assert.deepEqual(result.data, {
        home: {
          home_timeline_urt: {
            instructions: [],
          },
        },
      });
    } finally {
      xHttp.get = originalGet;
    }
  });

  it("requests next timeline page with POST body and cursor", async () => {
    const originalPost = xHttp.post;

    xHttp.post = (async (url: string, data?: unknown, config?: any) => {
      assert.ok(String(url).includes(`/i/api/graphql/${X_HOME_TIMELINE_QUERY_ID}/HomeTimeline`));
      assert.equal(config?.headers?.authorization, "Bearer test-token");
      assert.equal(config?.headers?.["x-csrf-token"], "csrf-token");
      assert.equal((data as any)?.variables.cursor, "cursor-1");
      assert.deepEqual((data as any)?.variables.seenTweetIds, ["1", "2"]);
      assert.equal((data as any)?.variables.includePromotedContent, true);
      assert.equal((data as any)?.queryId, X_HOME_TIMELINE_QUERY_ID);
      return {
        data: {
          data: {
            home: {
              home_timeline_urt: {
                instructions: [{ type: "TimelineAddEntries" }],
              },
            },
          },
        },
      } as any;
    }) as typeof xHttp.post;

    try {
      const result = await getHomeTimelineNext(
        {
          cursor: "cursor-1",
          seenTweetIds: ["1", "2"],
        },
        {
          cookie: "auth_token=test; ct0=csrf-token",
          authorization: "Bearer test-token",
          csrfToken: "csrf-token",
        },
      );

      assert.equal(result.code, 0);
      assert.deepEqual(result.data, {
        home: {
          home_timeline_urt: {
            instructions: [{ type: "TimelineAddEntries" }],
          },
        },
      });
    } finally {
      xHttp.post = originalPost;
    }
  });

  it("requests launch latest timeline with GET query parameters", async () => {
    const originalGet = xHttp.get;

    xHttp.get = (async (url: string, config?: any) => {
      assert.ok(String(url).includes(`/i/api/graphql/2ee46L1AFXmnTa0EvUog-Q/HomeLatestTimeline`));
      assert.equal(config?.headers?.authorization, "Bearer test-token");
      assert.equal(config?.headers?.["x-csrf-token"], "csrf-token");
      assert.equal(config?.params?.variables.count, 20);
      assert.equal(config?.params?.variables.enableRanking, false);
      assert.equal(config?.params?.variables.includePromotedContent, true);
      assert.equal(config?.params?.features.responsive_web_graphql_timeline_navigation_enabled, true);
      return {
        data: {
          data: {
            home: {
              home_timeline_urt: {
                instructions: [],
              },
            },
          },
        },
      } as any;
    }) as typeof xHttp.get;

    try {
      const result = await getHomeLatestTimeline(
        {
          cookie: "auth_token=test; ct0=csrf-token",
          authorization: "Bearer test-token",
          csrfToken: "csrf-token",
        },
        20,
      );

      assert.equal(result.code, 0);
      assert.deepEqual(result.data, {
        home: {
          home_timeline_urt: {
            instructions: [],
          },
        },
      });
    } finally {
      xHttp.get = originalGet;
    }
  });

  it("requests next latest timeline page with POST body and cursor", async () => {
    const originalPost = xHttp.post;

    xHttp.post = (async (url: string, data?: unknown, config?: any) => {
      assert.ok(String(url).includes(`/i/api/graphql/2ee46L1AFXmnTa0EvUog-Q/HomeLatestTimeline`));
      assert.equal(config?.headers?.authorization, "Bearer test-token");
      assert.equal(config?.headers?.["x-csrf-token"], "csrf-token");
      assert.equal((data as any)?.variables.cursor, "cursor-latest-1");
      assert.equal((data as any)?.variables.enableRanking, false);
      assert.equal((data as any)?.variables.includePromotedContent, true);
      assert.equal((data as any)?.queryId, "2ee46L1AFXmnTa0EvUog-Q");
      return {
        data: {
          data: {
            home: {
              home_timeline_urt: {
                instructions: [{ type: "TimelineAddEntries" }],
              },
            },
          },
        },
      } as any;
    }) as typeof xHttp.post;

    try {
      const result = await getHomeLatestTimelineNext(
        {
          cursor: "cursor-latest-1",
          seenTweetIds: [],
        },
        {
          cookie: "auth_token=test; ct0=csrf-token",
          authorization: "Bearer test-token",
          csrfToken: "csrf-token",
        },
      );

      assert.equal(result.code, 0);
      assert.deepEqual(result.data, {
        home: {
          home_timeline_urt: {
            instructions: [{ type: "TimelineAddEntries" }],
          },
        },
      });
    } finally {
      xHttp.post = originalPost;
    }
  });

  it("uses global credential when request credential is omitted", async () => {
    const originalGet = xHttp.get;

    setGlobalXCredential({
      cookie: "auth_token=global; ct0=global-csrf",
      authorization: "Bearer global-token",
      csrfToken: "global-csrf",
    });

    xHttp.get = (async (_url: string, config?: any) => {
      assert.equal(config?.headers?.authorization, "Bearer global-token");
      assert.equal(config?.headers?.["x-csrf-token"], "global-csrf");
      return {
        data: {
          data: {
            home: {
              home_timeline_urt: {
                instructions: [],
              },
            },
          },
        },
      } as any;
    }) as typeof xHttp.get;

    try {
      const result = await getHomeTimeline();
      assert.equal(result.code, 0);
    } finally {
      xHttp.get = originalGet;
      setGlobalXCredential(null);
    }
  });

  it("requests tweet detail with GET query parameters", async () => {
    const originalGet = xHttp.get;

    xHttp.get = (async (url: string, config?: any) => {
      assert.ok(
        String(url).includes(`/i/api/graphql/${X_TWEET_DETAIL_QUERY_ID}/TweetDetail`),
      );
      assert.equal(config?.headers?.authorization, "Bearer test-token");
      assert.equal(config?.headers?.["x-csrf-token"], "csrf-token");
      assert.equal(config?.params?.variables.focalTweetId, "2043619217845768577");
      assert.equal(config?.params?.variables.referrer, "home");
      assert.equal(config?.params?.variables.rankingMode, "Relevance");
      assert.equal(config?.params?.variables.includePromotedContent, true);
      assert.equal(config?.params?.fieldToggles.withArticleRichContentState, true);
      return {
        data: {
          data: {
            threaded_conversation_with_injections_v2: {
              instructions: [{ type: "TimelineAddEntries" }],
            },
          },
        },
      } as any;
    }) as typeof xHttp.get;

    try {
      const result = await getTweetDetail(
        "2043619217845768577",
        {
          cookie: "auth_token=test; ct0=csrf-token",
          authorization: "Bearer test-token",
          csrfToken: "csrf-token",
        },
      );

      assert.equal(result.code, 0);
      assert.deepEqual(result.data, {
        threaded_conversation_with_injections_v2: {
          instructions: [{ type: "TimelineAddEntries" }],
        },
      });
    } finally {
      xHttp.get = originalGet;
    }
  });

  it("requests search timeline with GET query parameters", async () => {
    const originalGet = xHttp.get;

    xHttp.get = (async (url: string, config?: any) => {
      assert.ok(
        String(url).includes(`/i/api/graphql/${X_SEARCH_TIMELINE_QUERY_ID}/SearchTimeline`),
      );
      assert.equal(config?.params?.variables.rawQuery, "openai");
      assert.equal(config?.params?.variables.product, "Top");
      assert.equal(config?.params?.variables.querySource, "typed_query");
      assert.equal(config?.params?.variables.cursor, "cursor-search");
      return {
        data: {
          data: {
            search_by_raw_query: {
              search_timeline: {
                timeline: {
                  instructions: [],
                },
              },
            },
          },
        },
      } as any;
    }) as typeof xHttp.get;

    try {
      const result = await getXSearchTimeline(
        {
          query: "openai",
          cursor: "cursor-search",
          product: "Top",
        },
        {
          cookie: "auth_token=test; ct0=csrf-token",
          authorization: "Bearer test-token",
          csrfToken: "csrf-token",
        },
      );

      assert.equal(result.code, 0);
      assert.deepEqual(result.data, {
        search_by_raw_query: {
          search_timeline: {
            timeline: {
              instructions: [],
            },
          },
        },
      });
    } finally {
      xHttp.get = originalGet;
    }
  });

  it("requests user info by screen name", async () => {
    const originalGet = xHttp.get;

    xHttp.get = (async (url: string, config?: any) => {
      assert.ok(
        String(url).includes(
          `/i/api/graphql/${X_USER_BY_SCREEN_NAME_QUERY_ID}/UserByScreenName`,
        ),
      );
      assert.equal(config?.params?.variables.screen_name, "yujiudu");
      assert.equal(config?.params?.fieldToggles.withAuxiliaryUserLabels, false);
      return {
        data: {
          data: {
            user: {
              result: {
                legacy: {
                  screen_name: "Yujiudu",
                },
              },
            },
          },
        },
      } as any;
    }) as typeof xHttp.get;

    try {
      const result = await getXUserInfo(
        "Yujiudu",
        {
          cookie: "auth_token=test; ct0=csrf-token",
          authorization: "Bearer test-token",
          csrfToken: "csrf-token",
        },
      );

      assert.equal(result.code, 0);
      assert.deepEqual(result.data, {
        user: {
          result: {
            legacy: {
              screen_name: "Yujiudu",
            },
          },
        },
      });
    } finally {
      xHttp.get = originalGet;
    }
  });

  it("requests user tweets by user id", async () => {
    const originalGet = xHttp.get;

    xHttp.get = (async (url: string, config?: any) => {
      assert.ok(
        String(url).includes(`/i/api/graphql/${X_USER_TWEETS_QUERY_ID}/UserTweets`),
      );
      assert.equal(config?.params?.variables.userId, "1718802931036622848");
      assert.equal(config?.params?.variables.cursor, "cursor-user");
      assert.equal(config?.params?.variables.includePromotedContent, true);
      assert.equal(config?.params?.fieldToggles.withArticlePlainText, false);
      return {
        data: {
          data: {
            user: {
              result: {
                timeline_v2: {
                  timeline: {
                    instructions: [],
                  },
                },
              },
            },
          },
        },
      } as any;
    }) as typeof xHttp.get;

    try {
      const result = await getXUserTweets(
        {
          userId: "1718802931036622848",
          cursor: "cursor-user",
        },
        {
          cookie: "auth_token=test; ct0=csrf-token",
          authorization: "Bearer test-token",
          csrfToken: "csrf-token",
        },
      );

      assert.equal(result.code, 0);
      assert.deepEqual(result.data, {
        user: {
          result: {
            timeline_v2: {
              timeline: {
                instructions: [],
              },
            },
          },
        },
      });
    } finally {
      xHttp.get = originalGet;
    }
  });
});
