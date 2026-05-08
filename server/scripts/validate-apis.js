const { createApp } = require("../src/app");
const { createConfigStore } = require("../src/configStore");

const probes = [
  ["/health", "system"],
  ["/api/ithome/news", "ithome"],
  ["/api/v2ex/list", "v2ex"],
  ["/api/linuxdo/list", "linuxdo"],
  ["/api/nga/list", "nga"],
  ["/api/weibo/hot-search", "weibo"],
  ["/api/bilibili/nav", "bilibili"],
  ["/api/qqmusic/search?keyword=%E5%91%A8%E6%9D%B0%E4%BC%A6", "qqmusic"],
  ["/api/zhihu/hot", "zhihu"],
  ["/api/xhs/me", "xhs"],
  ["/api/xiaoyuzhou/discovery-feed", "xiaoyuzhou"],
  ["/api/weread/shelf-sync", "weread"],
  ["/api/x/user-info?screenName=OpenAI", "x"],
];

async function main() {
  const configStore = createConfigStore();
  const app = createApp({ configStore });
  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  const port = app.address().port;
  const results = [];

  try {
    for (const [path, platform] of probes) {
      const startedAt = Date.now();
      try {
        const response = await fetch(`http://127.0.0.1:${port}${path}`);
        const text = await response.text();
        let body;
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
        results.push({
          platform,
          path,
          httpStatus: response.status,
          upstreamStatus: body?.status,
          ok: response.ok && (body?.ok !== false) && !String(body?.data?.message || "").includes("需要"),
          ms: Date.now() - startedAt,
          hint: body?.data?.message || body?.error || body?.data?.msg || body?.data?.message,
        });
      } catch (error) {
        results.push({
          platform,
          path,
          ok: false,
          ms: Date.now() - startedAt,
          hint: error.message,
        });
      }
    }
  } finally {
    await new Promise((resolve) => app.close(resolve));
  }

  console.table(results);
  const failed = results.filter((item) => !item.ok);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
