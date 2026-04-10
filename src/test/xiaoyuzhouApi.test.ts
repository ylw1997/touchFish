import * as assert from "assert";
import { describe, it } from "mocha";
import axios from "axios";

import {
  buildXiaoyuzhouHeaders,
  extractXiaoyuzhouAuth,
} from "../api/xiaoyuzhouShared";
import {
  getDiscoveryFeed,
  getSubscriptions,
  refreshXiaoyuzhouToken,
  setGlobalCredential,
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
    const originalPost = axios.post;
    let discoveryAttempts = 0;

    setGlobalCredential({
      accessToken: "expired-access",
      refreshToken: "refresh-token",
    });

    axios.post = (async (url: string, data?: unknown, config?: any) => {
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
    }) as typeof axios.post;

    try {
      const result = await getDiscoveryFeed(undefined, {
        accessToken: "expired-access",
        refreshToken: "refresh-token",
      });

      assert.equal(result.code, 0);
      assert.equal(discoveryAttempts, 2);
      assert.deepEqual(result.data, { data: [{ id: "ok" }] });
    } finally {
      axios.post = originalPost;
      setGlobalCredential(null);
    }
  });

  it("requests subscription list with access token and returns data", async () => {
    const originalPost = axios.post;

    axios.post = (async (url: string, data?: unknown, config?: any) => {
      assert.ok(String(url).includes("/v1/subscription/list"));
      assert.equal(config?.headers?.["x-jike-access-token"], "access-token");
      assert.equal((data as { limit?: string })?.limit, "20");
      return { data: { data: [{ podcast: { pid: "pid-1", title: "Podcast" } }] } };
    }) as typeof axios.post;

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
      axios.post = originalPost;
    }
  });

  it("extracts refreshed auth tokens from refresh endpoint response headers", async () => {
    const originalPost = axios.post;

    axios.post = (async () => ({
      headers: {
        "X-Jike-Access-Token": "new-access-token",
        "X-Jike-Refresh-Token": "new-refresh-token",
      },
    })) as typeof axios.post;

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
      axios.post = originalPost;
      setGlobalCredential(null);
    }
  });
});
