import * as assert from "assert";
import { describe, it } from "mocha";

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
});
