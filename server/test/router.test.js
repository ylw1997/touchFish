const assert = require("node:assert/strict");
const test = require("node:test");
const { createApp } = require("../src/app");

async function request(app, path, options = {}) {
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { response, body };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /health returns service status", async () => {
  const app = createApp();

  const { response, body } = await request(app, "/health");

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, "touchfish-server");
});

test("GET /api/catalog exposes platforms and endpoints for the web console", async () => {
  const app = createApp();

  const { response, body } = await request(app, "/api/catalog");

  assert.equal(response.status, 200);
  assert.ok(body.platforms.some((platform) => platform.id === "ithome"));
  assert.ok(body.platforms.some((platform) => platform.id === "weibo"));
  assert.ok(body.platforms.some((platform) => platform.id === "weread"));
  assert.ok(body.endpoints.length > 80);
  assert.ok(body.endpoints.some((endpoint) => endpoint.path === "/api/ithome/news"));
});

test("GET /api/catalog does not expose mojibake display names", async () => {
  const app = createApp();
  const mojibakePattern = /[�]|[绯荤粺鏈嶅姟鐘舵€佹帴鍙ｇ洰褰曟湰鍦伴厤缃鐭ヤ箮寰崥绔灏忓畤瀹堕棶闂傤噣顣閻閸鐠鐑鎺ㄨ崘鍏虫敞鍥炵瓟瀛愯瘎鎼滅储姒滃崟鍗曢泦璇︽儏]/;

  const { body } = await request(app, "/api/catalog");
  const displayValues = [
    ...body.platforms.flatMap((platform) => [platform.name, platform.description]),
    ...body.endpoints.map((endpoint) => endpoint.name),
  ];

  assert.deepEqual(displayValues.filter((value) => mojibakePattern.test(value)), []);
});

test("GET /api/ithome/news proxies upstream data", async () => {
  const app = createApp({
    fetch: async (url) => {
      assert.equal(url, "https://api.ithome.com/json/newslist/news?r=0");
      return new Response(JSON.stringify({ newslist: [{ title: "hello" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  const { response, body } = await request(app, "/api/ithome/news");

  assert.equal(response.status, 200);
  assert.deepEqual(body.data.newslist, [{ title: "hello" }]);
});

test("registered endpoints are routable instead of falling through to 404", async () => {
  const app = createApp({
    fetch: async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  });

  const { response, body } = await request(app, "/api/bilibili/popular");

  assert.equal(response.status, 200);
  assert.equal(body.status, 200);
  assert.deepEqual(body.data, { ok: true });
});

test("HTML news endpoints return structured JSON data", async () => {
  const app = createApp({
    fetch: async () =>
      new Response(
        '<table id="threadlisttableid"><a class="s xst" href="thread-123-1-1.html">Hello Chiphell</a></table>',
        {
          status: 200,
          headers: { "content-type": "text/html" },
        },
      ),
  });

  const { response, body } = await request(app, "/api/chiphell/list");

  assert.equal(response.status, 200);
  assert.deepEqual(body.data.items, [
    { title: "Hello Chiphell", url: "https://www.chiphell.com/thread-123-1-1.html" },
  ]);
});

test("QQMusic rank list is backed by musicu.fcg instead of placeholder", async () => {
  const app = createApp({
    fetch: async (url, options) => {
      assert.equal(url, "https://u.y.qq.com/cgi-bin/musicu.fcg");
      assert.equal(options.method, "POST");
      const body = JSON.parse(options.body);
      assert.ok(body["music.musicToplist.Toplist.GetAll"]);
      return new Response(
        JSON.stringify({
          code: 0,
          "music.musicToplist.Toplist.GetAll": {
            data: {
              group: [
                {
                  toplist: [
                    {
                      topId: 62,
                      title: "飙升榜",
                      titleShare: "QQ音乐飙升榜",
                      headPicUrl: "https://example.com/rank.jpg",
                      update_key: "2026-05-08",
                    },
                  ],
                },
              ],
            },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const { response, body } = await request(app, "/api/qqmusic/rank-lists");

  assert.equal(response.status, 200);
  assert.equal(body.status, 200);
  assert.deepEqual(body.data.items, [
    {
      id: 62,
      topId: 62,
      title: "飙升榜",
      subtitle: "QQ音乐飙升榜",
      picUrl: "https://example.com/rank.jpg",
      update_key: "2026-05-08",
    },
  ]);
});

test("unknown routes return a JSON 404", async () => {
  const app = createApp();

  const { response, body } = await request(app, "/missing");

  assert.equal(response.status, 404);
  assert.equal(body.ok, false);
});
