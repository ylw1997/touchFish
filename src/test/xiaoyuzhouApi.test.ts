import * as assert from "assert";
import { describe, it } from "mocha";

import {
  buildXiaoyuzhouHeaders,
  extractXiaoyuzhouAuth,
} from "../api/xiaoyuzhouShared";
import { parseXiaoyuzhouDiscoveryBlocks } from "../api/xiaoyuzhouDiscovery";
import {
  getDiscoveryFeed,
  getInboxList,
  getPilotDiscoveryList,
  getTopList,
  getSubscriptions,
  loginWithSms,
  createLoginQrCode,
  checkLoginQrCodeStatus,
  sendSmsCode,
  getMyProfile,
  refreshXiaoyuzhouToken,
  setGlobalCredential,
  xiaoyuzhouHttp,
} from "../api/xiaoyuzhou";

describe("xiaoyuzhou shared api helpers", () => {
  it("builds app headers with auth tokens and device id", () => {
    const headers = buildXiaoyuzhouHeaders({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      contentType: "application/json",
    });

    assert.equal(headers["x-jike-access-token"], "access-token");
    assert.equal(headers["x-jike-refresh-token"], "refresh-token");
    assert.equal(headers["x-jike-device-id"], "81ADBFD6-6921-482B-9AB9-A29E7CC7BB55");
    assert.equal(headers["Content-Type"], "application/json");
    assert.equal(headers.BundleID, "app.podcast.cosmos");
  });

  it("extracts auth tokens from response headers case-insensitively", () => {
    const auth = extractXiaoyuzhouAuth({
      "x-jike-access-token": "token-a",
      "X-Jike-Refresh-Token": "token-b",
    });

    assert.deepEqual(auth, {
      accessToken: "token-a",
      refreshToken: "token-b",
    });
  });

  it("refreshes token after a 401 and retries the request once", async () => {
    const originalPost = xiaoyuzhouHttp.post;
    let discoveryAttempts = 0;

    setGlobalCredential({
      accessToken: "expired-access",
      refreshToken: "refresh-token",
    });

    xiaoyuzhouHttp.post = (async (url: string, data?: unknown, config?: any) => {
      if (String(url).includes("/v1/discovery-feed/list")) {
        discoveryAttempts += 1;
        if (discoveryAttempts === 1) {
          const error = new Error("Unauthorized") as Error & {
            response?: { status: number; data: unknown };
          };
          error.response = { status: 401, data: { message: "expired" } };
          throw error;
        }

        assert.equal(
          config?.headers?.["x-jike-access-token"],
          "new-access-token",
        );
        return { data: { data: [{ id: "ok" }] } };
      }

      if (String(url).includes("/app_auth_tokens.refresh")) {
        assert.equal(
          config?.headers?.["x-jike-refresh-token"],
          "refresh-token",
        );
        return {
          headers: {
            "x-jike-access-token": "new-access-token",
            "x-jike-refresh-token": "new-refresh-token",
          },
        };
      }

      throw new Error(`Unexpected URL: ${url}`);
    }) as typeof xiaoyuzhouHttp.post;

    try {
      const result = await getDiscoveryFeed(undefined, {
        accessToken: "expired-access",
        refreshToken: "refresh-token",
      });

      assert.equal(result.code, 0);
      assert.equal(discoveryAttempts, 2);
      assert.deepEqual(result.data, { data: [{ id: "ok" }] });
    } finally {
      xiaoyuzhouHttp.post = originalPost;
      setGlobalCredential(null);
    }
  });

  it("refreshes token after a 401 on top list GET and retries once", async () => {
    const originalGet = xiaoyuzhouHttp.get;
    const originalPost = xiaoyuzhouHttp.post;
    let topListAttempts = 0;

    setGlobalCredential({
      accessToken: "expired-access",
      refreshToken: "refresh-token",
    });

    xiaoyuzhouHttp.get = (async (url: string, config?: any) => {
      if (String(url).includes("/v1/top-list/get")) {
        topListAttempts += 1;
        if (topListAttempts === 1) {
          const error = new Error("Unauthorized") as Error & {
            response?: { status: number; data: unknown };
          };
          error.response = { status: 401, data: { message: "expired" } };
          throw error;
        }

        assert.equal(
          config?.headers?.["x-jike-access-token"],
          "new-access-token",
        );
        return { data: { data: [{ id: "top-1" }] } } as any;
      }

      throw new Error(`Unexpected URL: ${url}`);
    }) as typeof xiaoyuzhouHttp.get;

    xiaoyuzhouHttp.post = (async (url: string, _data?: unknown, config?: any) => {
      if (String(url).includes("/app_auth_tokens.refresh")) {
        assert.equal(
          config?.headers?.["x-jike-refresh-token"],
          "refresh-token",
        );
        return {
          headers: {
            "x-jike-access-token": "new-access-token",
            "x-jike-refresh-token": "new-refresh-token",
          },
        } as any;
      }

      throw new Error(`Unexpected URL: ${url}`);
    }) as typeof xiaoyuzhouHttp.post;

    try {
      const result = await getTopList("ROCK", {
        accessToken: "expired-access",
        refreshToken: "refresh-token",
      });

      assert.equal(result.code, 0);
      assert.equal(topListAttempts, 2);
      assert.deepEqual(result.data, { data: [{ id: "top-1" }] });
    } finally {
      xiaoyuzhouHttp.get = originalGet;
      xiaoyuzhouHttp.post = originalPost;
      setGlobalCredential(null);
    }
  });

  it("requests subscription list with access token and returns data", async () => {
    const originalPost = xiaoyuzhouHttp.post;

    xiaoyuzhouHttp.post = (async (url: string, data?: unknown, config?: any) => {
      assert.ok(String(url).includes("/v1/subscription/list"));
      assert.equal(config?.headers?.["x-jike-access-token"], "access-token");
      assert.equal((data as { limit?: string })?.limit, "20");
      return { data: { data: [{ podcast: { pid: "pid-1", title: "Podcast" } }] } };
    }) as typeof xiaoyuzhouHttp.post;

    try {
      const result = await getSubscriptions(undefined, {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      assert.equal(result.code, 0);
      assert.deepEqual(result.data, {
        data: [{ podcast: { pid: "pid-1", title: "Podcast" } }],
      });
    } finally {
      xiaoyuzhouHttp.post = originalPost;
    }
  });

  it("requests pilot discovery list with access token and returns podcasts", async () => {
    const originalPost = xiaoyuzhouHttp.post;

    xiaoyuzhouHttp.post = (async (url: string, _data?: unknown, config?: any) => {
      assert.ok(String(url).includes("/v1/pilot-discovery/list"));
      assert.equal(config?.headers?.["x-jike-access-token"], "access-token");
      return {
        data: {
          data: [
            {
              podcast: {
                pid: "pid-pilot-1",
                title: "Pilot Podcast",
              },
            },
          ],
        },
      };
    }) as typeof xiaoyuzhouHttp.post;

    try {
      const result = await getPilotDiscoveryList({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      assert.equal(result.code, 0);
      assert.deepEqual(result.data, {
        data: [
          {
            podcast: {
              pid: "pid-pilot-1",
              title: "Pilot Podcast",
            },
          },
        ],
      });
    } finally {
      xiaoyuzhouHttp.post = originalPost;
    }
  });

  it("requests inbox list with access token and returns episodes", async () => {
    const originalPost = xiaoyuzhouHttp.post;

    xiaoyuzhouHttp.post = (async (url: string, data?: unknown, config?: any) => {
      assert.ok(String(url).includes("/v1/inbox/list"));
      assert.equal(config?.headers?.["x-jike-access-token"], "access-token");
      assert.equal((data as { limit?: string })?.limit, "20");
      return {
        data: {
          data: [
            {
              episode: {
                eid: "eid-inbox-1",
                title: "Inbox Episode",
              },
            },
          ],
        },
      };
    }) as typeof xiaoyuzhouHttp.post;

    try {
      const result = await getInboxList(undefined, {
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      assert.equal(result.code, 0);
      assert.deepEqual(result.data, {
        data: [
          {
            episode: {
              eid: "eid-inbox-1",
              title: "Inbox Episode",
            },
          },
        ],
      });
    } finally {
      xiaoyuzhouHttp.post = originalPost;
    }
  });

  it("extracts refreshed auth tokens from refresh endpoint response headers", async () => {
    const originalPost = xiaoyuzhouHttp.post;

    xiaoyuzhouHttp.post = (async () => ({
      headers: {
        "X-Jike-Access-Token": "new-access-token",
        "X-Jike-Refresh-Token": "new-refresh-token",
      },
    })) as typeof xiaoyuzhouHttp.post;

    try {
      const credential = await refreshXiaoyuzhouToken({
        accessToken: "old-access",
        refreshToken: "old-refresh",
      });

      assert.deepEqual(credential, {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
    } finally {
      xiaoyuzhouHttp.post = originalPost;
      setGlobalCredential(null);
    }
  });

  it("refreshes credential immediately after sms login and returns the refreshed tokens", async () => {
    const originalPost = xiaoyuzhouHttp.post;
    let callCount = 0;

    xiaoyuzhouHttp.post = (async (url: string) => {
      callCount += 1;

      if (callCount === 1) {
        assert.ok(String(url).includes("/v1/auth/login-with-sms"));
        return {
          headers: {
            "x-jike-access-token": "login-access-token",
            "x-jike-refresh-token": "login-refresh-token",
          },
          data: {
            data: {
              user: {
                uid: "uid-1",
                nickname: "tester",
                avatar: { picture: { smallPicUrl: "avatar-url" } },
              },
            },
          },
        };
      }

      assert.ok(String(url).includes("/app_auth_tokens.refresh"));
      return {
        headers: {
          "x-jike-access-token": "stable-access-token",
          "x-jike-refresh-token": "stable-refresh-token",
        },
      };
    }) as typeof xiaoyuzhouHttp.post;

    try {
      const result = await loginWithSms("17600000000", "1234");

      assert.equal(result.code, 0);
      assert.equal(callCount, 2);
      assert.deepEqual(result.data?.credential, {
        accessToken: "stable-access-token",
        refreshToken: "stable-refresh-token",
      });
      assert.equal(result.data?.userInfo.nickname, "tester");
    } finally {
      xiaoyuzhouHttp.post = originalPost;
      setGlobalCredential(null);
    }
  });

  it("parses banner, recommendation, and editor pick blocks from discovery feed", () => {
    const blocks = parseXiaoyuzhouDiscoveryBlocks([
      {
        type: "DISCOVERY_COVER_BANNER",
        data: [{ id: "banner-1", image: "banner.jpg", voiceover: "banner" }],
      },
      {
        type: "DISCOVERY_EPISODE_RECOMMEND",
        data: {
          title: "为你推荐",
          target: [
            {
              episode: { eid: "ep-1", title: "Episode 1" },
            },
          ],
        },
      },
      {
        type: "EDITOR_PICK",
        data: {
          date: "2026-04-10",
          picks: [
            {
              episode: { eid: "ep-2", title: "Episode 2" },
            },
          ],
        },
      },
    ]);

    assert.equal(blocks.length, 3);
    assert.deepEqual(blocks[0], {
      type: "BANNER",
      items: [
        {
          id: "banner-1",
          image: "banner.jpg",
          url: undefined,
          title: "banner",
        },
      ],
    });
    assert.equal(blocks[1].type, "EPISODES");
    assert.equal(blocks[1].items[0].eid, "ep-1");
    assert.equal(blocks[2].type, "EDITOR_PICK");
    assert.equal(blocks[2].title, "编辑精选");
    assert.equal(blocks[2].items[0].eid, "ep-2");
  });

  it("creates login qrcode successfully", async () => {
    const originalPost = xiaoyuzhouHttp.post;
    xiaoyuzhouHttp.post = (async (url: string) => {
      assert.ok(String(url).includes("/v1/auth/qrcode/create"));
      return {
        data: {
          id: "mock-qr-id",
          url: "https://www.xiaoyuzhoufm.com/qr/mock",
        },
      };
    }) as typeof xiaoyuzhouHttp.post;

    try {
      const result = await createLoginQrCode();
      assert.equal(result.code, 0);
      assert.equal(result.data?.id, "mock-qr-id");
      assert.equal(result.data?.url, "https://www.xiaoyuzhoufm.com/qr/mock");
    } finally {
      xiaoyuzhouHttp.post = originalPost;
    }
  });

  it("checks qrcode status and returns confirmed credentials with user info", async () => {
    const originalPost = xiaoyuzhouHttp.post;
    const originalGet = xiaoyuzhouHttp.get;

    xiaoyuzhouHttp.post = (async (url: string) => {
      if (String(url).includes("/v1/auth/qrcode/login")) {
        return {
          headers: {
            "x-jike-access-token": "qr-access-token",
            "x-jike-refresh-token": "qr-refresh-token",
          },
          data: {
            status: "CONFIRMED",
          },
        };
      }
      if (String(url).includes("/app_auth_tokens.refresh")) {
        return {
          headers: {
            "x-jike-access-token": "stable-qr-access",
            "x-jike-refresh-token": "stable-qr-refresh",
          },
        };
      }
      throw new Error(`Unexpected POST: ${url}`);
    }) as typeof xiaoyuzhouHttp.post;

    xiaoyuzhouHttp.get = (async (url: string) => {
      if (String(url).includes("/v1/profile/get")) {
        return {
          data: {
            data: {
              user: {
                uid: "qr-user-1",
                nickname: "扫码用户",
              },
            },
          },
        };
      }
      throw new Error(`Unexpected GET: ${url}`);
    }) as typeof xiaoyuzhouHttp.get;

    try {
      const result = await checkLoginQrCodeStatus("mock-qr-id");
      assert.equal(result.code, 0);
      assert.equal(result.data.status, "CONFIRMED");
      assert.equal(result.data.credential?.accessToken, "stable-qr-access");
      assert.equal(result.data.userInfo?.nickname, "扫码用户");
    } finally {
      xiaoyuzhouHttp.post = originalPost;
      xiaoyuzhouHttp.get = originalGet;
      setGlobalCredential(null);
    }
  });

  it("gets my profile and normalizes user info", async () => {
    const originalGet = xiaoyuzhouHttp.get;
    xiaoyuzhouHttp.get = (async (url: string) => {
      assert.ok(String(url).includes("/v1/profile/get"));
      return {
        data: {
          data: {
            user: {
              id: "profile-uid",
              name: "个人主页用户",
              avatarUrl: "https://avatar.url",
            },
          },
        },
      };
    }) as typeof xiaoyuzhouHttp.get;

    try {
      const result = await getMyProfile({
        accessToken: "test-token",
        refreshToken: "test-refresh",
      });
      assert.equal(result.code, 0);
      assert.equal(result.data?.uid, "profile-uid");
      assert.equal(result.data?.nickname, "个人主页用户");
      assert.equal(result.data?.avatar, "https://avatar.url");
    } finally {
      xiaoyuzhouHttp.get = originalGet;
    }
  });

  it("returns user-friendly error message when send-code requires captcha", async () => {
    const originalPost = xiaoyuzhouHttp.post;
    xiaoyuzhouHttp.post = (async () => {
      const error: any = new Error("Request failed with status code 400");
      error.isAxiosError = true;
      error.response = {
        status: 400,
        data: {
          code: 1,
          message: "body/captcha Invalid input: expected object, received undefined",
        },
      };
      throw error;
    }) as typeof xiaoyuzhouHttp.post;

    try {
      const result = await sendSmsCode("13800000000");
      assert.equal(result.code, 400);
      assert.equal(result.data, false);
      assert.ok(result.message?.includes("人机安全验证"));
    } finally {
      xiaoyuzhouHttp.post = originalPost;
    }
  });
});
