const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildXCredential,
  buildXHeaders,
  getXhsSignature,
  getZhihuSignature,
} = require("../src/signers");
const { buildXiaoyuzhouHeaders, extractXiaoyuzhouAuth } = require("../src/xiaoyuzhouCore");
const { sign } = require("../src/qqmusicCore");

test("zhihu signer returns an x-zse-96 value", async () => {
  const signature = await getZhihuSignature("101_3_3.0+/api/test+d_c0");

  assert.equal(typeof signature, "string");
  assert.ok(signature.length > 10);
});

test("xhs signer returns required signed headers", async () => {
  const signature = await getXhsSignature(
    "/api/sns/web/v2/user/me",
    "",
    "a1=test-a1-value;",
    "GET",
  );

  assert.ok(signature.xs);
  assert.ok(signature.xt);
  assert.ok(signature.xs_common);
});

test("x credential extracts csrf token from cookie", () => {
  const credential = buildXCredential({
    cookie: "ct0=csrf-token; auth_token=token;",
    authorization: "Bearer test",
  });

  assert.equal(credential.csrfToken, "csrf-token");
  assert.equal(buildXHeaders(credential)["x-csrf-token"], "csrf-token");
});

test("xiaoyuzhou headers and auth extraction work", () => {
  const headers = buildXiaoyuzhouHeaders({
    accessToken: "access",
    refreshToken: "refresh",
    contentType: "application/json",
    localTime: "2026-04-30T12:00:00+08:00",
    deviceId: "device",
  });

  assert.equal(headers["x-jike-access-token"], "access");
  assert.deepEqual(
    extractXiaoyuzhouAuth({
      "x-jike-access-token": "new-access",
      "x-jike-refresh-token": ["new-refresh"],
    }),
    { accessToken: "new-access", refreshToken: "new-refresh" },
  );
});

test("qqmusic signer returns a stable musicu signature", () => {
  const payload = { comm: { tmeAppID: "qqmusic" }, req: { module: "x", method: "y", param: {} } };
  const value = sign(payload);

  assert.match(value, /^zzc[a-z0-9]+$/);
  assert.equal(value, sign(payload));
});
