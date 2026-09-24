import * as assert from "assert";
import { suite, test } from "mocha";
import {
  parseCookieString,
  serializeCookieMap,
  mergeCookies,
} from "../utils/cookieUtils";

suite("cookieUtils", () => {
  test("parseCookieString parses simple cookie string", () => {
    const map = parseCookieString("SUB=_2A25l; SUBP=0033; _s_tentry=-");
    assert.strictEqual(map.get("SUB"), "_2A25l");
    assert.strictEqual(map.get("SUBP"), "0033");
    assert.strictEqual(map.get("_s_tentry"), "-");
  });

  test("parseCookieString handles values with equal signs", () => {
    const map = parseCookieString("XSRF-TOKEN=abc==; test=1=2=3");
    assert.strictEqual(map.get("XSRF-TOKEN"), "abc==");
    assert.strictEqual(map.get("test"), "1=2=3");
  });

  test("serializeCookieMap serializes map into valid cookie string", () => {
    const map = new Map<string, string>();
    map.set("SUB", "new_sub");
    map.set("SUBP", "new_subp");
    assert.strictEqual(serializeCookieMap(map), "SUB=new_sub; SUBP=new_subp");
  });

  test("mergeCookies updates changed keys and preserves existing keys", () => {
    const current = "SUB=_2A25old; SUBP=0033old; _s_tentry=-; Apache=123";
    const setCookies = [
      "SUB=_2A25new; expires=Sun, 24 Oct 2026 01:23:45 GMT; path=/; domain=.weibo.com; HttpOnly",
      "extra=value456; path=/",
    ];

    const result = mergeCookies(current, setCookies);
    assert.strictEqual(result.hasChanged, true);
    assert.deepStrictEqual(result.updatedKeys, ["SUB", "extra"]);
    assert.strictEqual(
      result.updatedCookie,
      "SUB=_2A25new; SUBP=0033old; _s_tentry=-; Apache=123; extra=value456"
    );
  });

  test("mergeCookies ignores empty or deleted values", () => {
    const current = "SUB=_2A25old; SUBP=0033old";
    const setCookies = [
      "SUB=; expires=Thu, 01 Jan 1970 00:00:00 GMT",
      "SUBP=deleted; path=/",
    ];

    const result = mergeCookies(current, setCookies);
    assert.strictEqual(result.hasChanged, false);
    assert.strictEqual(result.updatedCookie, current);
  });

  test("mergeCookies returns hasChanged=false when values are identical", () => {
    const current = "SUB=_2A25val; SUBP=0033val";
    const setCookies = ["SUB=_2A25val; path=/"];

    const result = mergeCookies(current, setCookies);
    assert.strictEqual(result.hasChanged, false);
  });
});
