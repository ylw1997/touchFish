import * as assert from "assert";
import { describe, it } from "mocha";

import {
  assertWeReadAuthenticated,
  assertWeReadTextAuthenticated,
  WeReadAuthError,
} from "../api/weread/auth";
import { WeReadClient } from "../api/weread/client";

describe("WeReadClient", () => {
  it("uses a replaced cookie on the next request", async () => {
    const client = new WeReadClient({ cookie: "wr_skey=old" });
    const cookies: string[] = [];

    await client.execute(async (cookie: string) => {
      cookies.push(cookie);
      return { ok: true };
    });

    client.setCookie("wr_skey=new");

    await client.execute(async (cookie: string) => {
      cookies.push(cookie);
      return { ok: true };
    });

    assert.deepEqual(cookies, ["wr_skey=old", "wr_skey=new"]);
  });

  it("renews once for concurrent expired requests and persists the new cookie", async () => {
    let renewalCount = 0;
    let persistedCookie = "";
    const client = new WeReadClient(
      { cookie: "wr_skey=old; wr_vid=1; wr_rt=old-refresh" },
      async (cookie) => {
        await Promise.resolve();
        persistedCookie = cookie;
      },
      async () => {
        renewalCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return {
          accessToken: "new",
          vid: "2",
          refreshToken: "new-refresh",
        };
      },
    );

    const cookies: string[] = [];
    const request = async (cookie: string) => {
      cookies.push(cookie);
      if (cookie.includes("wr_skey=old")) {
        return { errCode: -2013, errMsg: "鉴权失败" };
      }
      return { ok: true };
    };

    const results = await Promise.all([
      client.execute(request),
      client.execute(request),
      client.execute(request),
    ]);

    assert.equal(renewalCount, 1);
    assert.deepEqual(results, [{ ok: true }, { ok: true }, { ok: true }]);
    assert.ok(persistedCookie.includes("wr_skey=new"));
    assert.ok(persistedCookie.includes("wr_vid=2"));
    assert.ok(persistedCookie.includes("wr_rt=new-refresh"));
    assert.equal(cookies.filter((cookie) => cookie.includes("wr_skey=old")).length, 3);
    assert.equal(cookies.filter((cookie) => cookie.includes("wr_skey=new")).length, 3);
  });

  it("renews when an API throws a structured auth error", async () => {
    const client = new WeReadClient(
      { cookie: "wr_skey=old" },
      undefined,
      async () => ({ accessToken: "new" }),
    );
    const cookies: string[] = [];

    const result = await client.execute(async (cookie: string) => {
      cookies.push(cookie);
      if (cookie.includes("wr_skey=old")) {
        throw Object.assign(new Error("鉴权失败"), { errCode: -2013 });
      }
      return { ok: true };
    });

    assert.deepEqual(result, { ok: true });
    assert.deepEqual(cookies, ["wr_skey=old", "wr_skey=new"]);
  });

  it("does not renew again when a late request failed with the previous cookie", async () => {
    let renewalCount = 0;
    const client = new WeReadClient(
      { cookie: "wr_skey=old" },
      undefined,
      async () => {
        renewalCount += 1;
        return { accessToken: "new" };
      },
    );

    let releaseLateRequest!: () => void;
    const lateRequestReady = new Promise<void>((resolve) => {
      releaseLateRequest = resolve;
    });
    const lateRequest = client.execute(async (cookie: string) => {
      if (cookie.includes("wr_skey=old")) {
        await lateRequestReady;
        return { errCode: -2013 };
      }
      return { ok: true };
    });

    await client.execute(async (cookie: string) =>
      cookie.includes("wr_skey=old") ? { errCode: -2013 } : { ok: true },
    );
    releaseLateRequest();

    assert.deepEqual(await lateRequest, { ok: true });
    assert.equal(renewalCount, 1);
  });

  it("normalizes auth failures returned as response data", () => {
    assert.throws(
      () => assertWeReadAuthenticated({ errCode: -2013, errMsg: "鉴权失败" }),
      (error: any) =>
        error instanceof WeReadAuthError && error.errCode === -2013,
    );
    assert.doesNotThrow(() => assertWeReadAuthenticated({ succ: 1 }));
  });

  it("detects auth failures hidden in chapter text responses", () => {
    assert.throws(
      () =>
        assertWeReadTextAuthenticated(
          JSON.stringify({ errCode: -2012, errMsg: "登录超时" }),
        ),
      (error: any) =>
        error instanceof WeReadAuthError && error.errCode === -2012,
    );
    assert.doesNotThrow(() => assertWeReadTextAuthenticated("encrypted-content"));
  });
});
