async function readUpstreamJson(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (contentType.includes("application/json")) {
    return JSON.parse(text);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function fetchJson(fetchImpl, url, options = {}) {
  const response = await fetchImpl(url, options);
  const data = await readUpstreamJson(response);
  return {
    ok: response.ok,
    status: response.status,
    url,
    data,
  };
}

function commonHeaders(cookie, extra = {}) {
  return {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    ...(cookie ? { cookie } : {}),
    ...extra,
  };
}

module.exports = { fetchJson, commonHeaders };
