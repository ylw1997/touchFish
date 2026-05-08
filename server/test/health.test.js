const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

process.env.TOUCHFISH_HEALTH_REPORT_PATH = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), "touchfish-health-")),
  "health-report.json",
);

const { createApp } = require("../src/app");

async function request(app, path, options = {}) {
  const server = app.listen(0);
  try {
    await new Promise((resolve) => server.once("listening", resolve));
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
    return { response, body: await response.json() };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /api/health-report returns cached empty report first", async () => {
  const app = createApp();

  const { response, body } = await request(app, "/api/health-report");

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.deepEqual(body.data.items, []);
});

test("POST /api/health-report/run validates runnable endpoints and caches result", async () => {
  const app = createApp({
    fetch: async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  });

  const run = await request(app, "/api/health-report/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpointIds: ["ithome-news", "bilibili-popular"] }),
  });

  assert.equal(run.response.status, 200);
  assert.equal(run.body.ok, true);
  assert.equal(run.body.data.items.length, 2);
  assert.equal(run.body.data.items[0].status, "passed");

  const cached = await request(app, "/api/health-report");
  assert.equal(cached.body.data.items.length, 2);
});
