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

test("unknown routes return a JSON 404", async () => {
  const app = createApp();

  const { response, body } = await request(app, "/missing");

  assert.equal(response.status, 404);
  assert.equal(body.ok, false);
});
