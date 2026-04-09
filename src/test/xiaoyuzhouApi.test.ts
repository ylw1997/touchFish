import * as assert from "assert";
import { describe, it } from "mocha";

import {
  buildXiaoyuzhouHeaders,
  extractXiaoyuzhouAuth,
} from "../api/xiaoyuzhouShared";

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
});
