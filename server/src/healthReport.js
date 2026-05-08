const fs = require("node:fs");
const path = require("node:path");
const { endpoints, executeApiEndpoint } = require("./apiRegistry");

const cachePath = process.env.TOUCHFISH_HEALTH_REPORT_PATH || path.join(__dirname, "..", "data", "health-report.json");

function readCachedReport() {
  if (!fs.existsSync(cachePath)) {
    return { generatedAt: null, summary: null, items: [] };
  }
  return JSON.parse(fs.readFileSync(cachePath, "utf8").replace(/^\uFEFF/, ""));
}

function writeCachedReport(report) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(report, null, 2));
}

function buildProbeUrl(endpoint) {
  const url = new URL(endpoint.path, "http://127.0.0.1");
  for (const param of endpoint.params || []) {
    if (!param.required) continue;
    if (!param.example) return null;
    url.searchParams.set(param.name, param.example);
  }
  return url;
}

function summarize(items) {
  return items.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    { total: 0, passed: 0, failed: 0, skipped: 0, not_implemented: 0 },
  );
}

function mergeReportItems(previousItems, selectedIds, nextItems) {
  if (!selectedIds?.length) return nextItems;
  const selected = new Set(selectedIds);
  return (previousItems || [])
    .filter((item) => !selected.has(item.id))
    .concat(nextItems);
}

function classifyResult(result, elapsedMs) {
  if (result?.status === 501) return { status: "not_implemented", message: result.data?.message, elapsedMs };
  if (result?.status >= 200 && result?.status < 300 && result?.ok !== false) {
    return { status: "passed", message: result.data?.msg || result.data?.message, elapsedMs };
  }
  return {
    status: "failed",
    message: result?.data?.message || result?.data?.msg || result?.error || `HTTP ${result?.status || "unknown"}`,
    upstreamStatus: result?.status,
    elapsedMs,
  };
}

async function runHealthReport({ endpointIds, fetchImpl, configStore }) {
  const selected = endpointIds?.length
    ? endpoints.filter((endpoint) => endpointIds.includes(endpoint.id))
    : endpoints;
  const items = [];

  for (const endpoint of selected) {
    const startedAt = Date.now();
    const publicEndpoint = (({ handler, ...rest }) => rest)(endpoint);

    if (endpoint.method !== "GET") {
      items.push({
        ...publicEndpoint,
        status: "skipped",
        message: "跳过非 GET 接口，避免误触发写操作。",
        elapsedMs: 0,
      });
      continue;
    }

    const url = buildProbeUrl(endpoint);
    if (!url) {
      items.push({
        ...publicEndpoint,
        status: "skipped",
        message: "缺少必填参数示例，无法自动验证。",
        elapsedMs: 0,
      });
      continue;
    }

    try {
      // 添加 100 秒超时，防止卡住
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("验证超时 (100s)")), 100000)
      );
      const resultPromise = executeApiEndpoint({
        method: endpoint.method,
        pathname: endpoint.path,
        url,
        fetchImpl,
        configStore,
        body: "",
      });
      const result = await Promise.race([resultPromise, timeoutPromise]);
      items.push({
        ...publicEndpoint,
        ...classifyResult(result, Date.now() - startedAt),
      });
    } catch (error) {
      items.push({
        ...publicEndpoint,
        status: "failed",
        message: error.message || "验证失败",
        elapsedMs: Date.now() - startedAt,
      });
    }
  }

  const previous = readCachedReport();
  const reportItems = mergeReportItems(previous.items, endpointIds, items);
  const report = { generatedAt: new Date().toISOString(), summary: summarize(reportItems), items: reportItems };
  writeCachedReport(report);
  return report;
}

module.exports = {
  readCachedReport,
  runHealthReport,
};
