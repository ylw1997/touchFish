const state = {
  platforms: [],
  endpoints: [],
  platformId: "system",
  endpoint: null,
  search: "",
  statusFilter: "all",
  health: new Map(),
  healthSummary: null,
};

const searchInput = document.querySelector("#searchInput");
const validatePlatformButton = document.querySelector("#validatePlatformButton");
const validateAllButton = document.querySelector("#validateAllButton");
const platformList = document.querySelector("#platformList");
const statusFilters = document.querySelector("#statusFilters");
const endpointList = document.querySelector("#endpointList");
const platformKicker = document.querySelector("#platformKicker");
const platformName = document.querySelector("#platformName");
const endpointCount = document.querySelector("#endpointCount");
const methodBadge = document.querySelector("#methodBadge");
const endpointPath = document.querySelector("#endpointPath");
const endpointDescription = document.querySelector("#endpointDescription");
const sendButton = document.querySelector("#sendButton");
const copyButton = document.querySelector("#copyButton");
const paramForm = document.querySelector("#paramForm");
const payloadInput = document.querySelector("#payloadInput");
const configKey = document.querySelector("#configKey");
const configValue = document.querySelector("#configValue");
const saveConfigButton = document.querySelector("#saveConfigButton");
const statusText = document.querySelector("#statusText");
const durationText = document.querySelector("#durationText");
const healthSummary = document.querySelector("#healthSummary");
const responseBody = document.querySelector("#responseBody");

const statusLabels = {
  all: "All",
  unknown: "Unknown",
  passed: "Passed",
  failed: "Failed",
  skipped: "Skipped",
  not_implemented: "Todo",
};

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function platformLabel(id) {
  return state.platforms.find((platform) => platform.id === id)?.name || id;
}

function healthFor(endpointId) {
  return state.health.get(endpointId);
}

function endpointStatus(endpoint) {
  return healthFor(endpoint.id)?.status || "unknown";
}

function visibleEndpointsForPlatform(platformId = state.platformId) {
  const search = state.search.toLowerCase();
  return state.endpoints.filter((endpoint) => {
    if (endpoint.platformId !== platformId) return false;
    if (state.statusFilter !== "all" && endpointStatus(endpoint) !== state.statusFilter) return false;
    if (!search) return true;
    return `${endpoint.name} ${endpoint.path} ${endpoint.description || ""}`.toLowerCase().includes(search);
  });
}

function renderHealthSummary() {
  if (!state.healthSummary) {
    healthSummary.classList.remove("visible");
    healthSummary.innerHTML = "";
    return;
  }

  const summary = state.healthSummary;
  healthSummary.classList.add("visible");
  healthSummary.innerHTML = [
    ["Total", summary.total],
    ["Passed", summary.passed],
    ["Failed", summary.failed],
    ["Skipped", summary.skipped],
    ["Todo", summary.not_implemented],
  ]
    .map(([label, value]) => `<button class="health-pill" data-health-filter="${label.toLowerCase() === "todo" ? "not_implemented" : label.toLowerCase()}">${label} <strong>${value || 0}</strong></button>`)
    .join("");
}

function renderStatusFilters() {
  const counts = state.endpoints
    .filter((endpoint) => endpoint.platformId === state.platformId)
    .reduce(
      (acc, endpoint) => {
        acc.all += 1;
        acc[endpointStatus(endpoint)] = (acc[endpointStatus(endpoint)] || 0) + 1;
        return acc;
      },
      { all: 0, unknown: 0, passed: 0, failed: 0, skipped: 0, not_implemented: 0 },
    );

  statusFilters.innerHTML = Object.entries(statusLabels)
    .map(
      ([status, label]) => `
        <button class="${state.statusFilter === status ? "active" : ""}" data-status-filter="${status}">
          ${label} <strong>${counts[status] || 0}</strong>
        </button>
      `,
    )
    .join("");
}

function renderPlatforms() {
  const search = state.search.toLowerCase();
  platformList.innerHTML = state.platforms
    .filter((platform) => {
      if (!search && state.statusFilter === "all") return true;
      return visibleEndpointsForPlatform(platform.id).length > 0 ||
        `${platform.name} ${platform.id} ${platform.description}`.toLowerCase().includes(search);
    })
    .map(
      (platform) => `
        <button class="platform-button ${platform.id === state.platformId ? "active" : ""}" data-platform="${platform.id}">
          <strong>${platform.name}</strong><br />
          <span>${platform.description}</span>
        </button>
      `,
    )
    .join("");
}

function renderEndpoints() {
  const endpoints = visibleEndpointsForPlatform();

  platformKicker.textContent = state.platformId;
  platformName.textContent = platformLabel(state.platformId);
  endpointCount.textContent = `${endpoints.length} APIs`;
  renderStatusFilters();
  endpointList.innerHTML = endpoints
    .map((endpoint) => {
      const health = healthFor(endpoint.id);
      const message = health?.message ? `<span>${health.message}</span>` : "";
      return `
        <button class="endpoint-button ${state.endpoint?.id === endpoint.id ? "active" : ""}" data-endpoint="${endpoint.id}">
          <strong><i class="status-dot status-${health?.status || "unknown"}"></i>${endpoint.name}</strong>
          <span>${endpoint.method} ${endpoint.path}</span>
          ${message}
        </button>
      `;
    })
    .join("");

  if (!endpoints.includes(state.endpoint)) {
    selectEndpoint(endpoints[0]);
  }
}

function selectEndpoint(endpoint) {
  state.endpoint = endpoint;
  if (!endpoint) {
    endpointPath.textContent = "";
    endpointDescription.textContent = "No endpoint matches the current filters.";
    paramForm.innerHTML = "";
    return;
  }

  const health = healthFor(endpoint.id);
  methodBadge.textContent = endpoint.method;
  endpointPath.textContent = endpoint.path;
  endpointDescription.textContent = health?.message || endpoint.description || "";
  payloadInput.parentElement.classList.toggle("visible", endpoint.method !== "GET");
  payloadInput.value = endpoint.method === "GET" ? "{}" : payloadInput.value || "{}";
  paramForm.innerHTML = (endpoint.params || [])
    .map(
      (param) => `
        <div class="param-field">
          <label for="param-${param.name}">${param.name}${param.required ? " *" : ""}</label>
          <input id="param-${param.name}" name="${param.name}" placeholder="${param.example || ""}" />
        </div>
      `,
    )
    .join("");
  renderEndpoints();
}

function buildRequestUrl(endpoint) {
  const url = new URL(endpoint.path, window.location.origin);
  new FormData(paramForm).forEach((value, key) => {
    if (String(value).trim()) url.searchParams.set(key, String(value).trim());
  });
  return url;
}

async function sendRequest() {
  if (!state.endpoint) return;

  const startedAt = performance.now();
  const url = buildRequestUrl(state.endpoint);
  const options = { method: state.endpoint.method };
  if (state.endpoint.method !== "GET") {
    options.headers = { "content-type": "application/json" };
    options.body = payloadInput.value || "{}";
  }

  sendButton.disabled = true;
  statusText.textContent = "Requesting";
  durationText.textContent = "";
  responseBody.textContent = `${state.endpoint.method} ${url.pathname}${url.search}`;

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    statusText.textContent = `${response.status} ${response.statusText}`;
    responseBody.textContent = pretty(body);
  } catch (error) {
    statusText.textContent = "Request failed";
    responseBody.textContent = error.stack || error.message;
  } finally {
    durationText.textContent = `${Math.round(performance.now() - startedAt)}ms`;
    sendButton.disabled = false;
  }
}

async function copyRequest() {
  if (!state.endpoint) return;
  const url = buildRequestUrl(state.endpoint);
  const command =
    state.endpoint.method === "GET"
      ? `curl "${url}"`
      : `curl -X ${state.endpoint.method} "${url}" -H "Content-Type: application/json" --data '${payloadInput.value || "{}"}'`;
  await navigator.clipboard.writeText(command);
  statusText.textContent = "Copied curl";
}

async function saveConfig() {
  saveConfigButton.disabled = true;
  try {
    const response = await fetch(`/api/config/${encodeURIComponent(configKey.value)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: configValue.value }),
    });
    statusText.textContent = response.ok ? `Saved ${configKey.value}` : "Save failed";
    configValue.value = "";
  } finally {
    saveConfigButton.disabled = false;
  }
}

function applyHealthReport(report) {
  state.health = new Map((report.items || []).map((item) => [item.id, item]));
  state.healthSummary = report.summary || null;
  renderHealthSummary();
  renderPlatforms();
  renderEndpoints();
}

async function loadHealthReport() {
  const response = await fetch("/api/health-report");
  const body = await response.json();
  applyHealthReport(body.data);
}

async function runHealthReport(scope) {
  const endpointIds =
    scope === "platform"
      ? state.endpoints
          .filter((endpoint) => endpoint.platformId === state.platformId)
          .map((endpoint) => endpoint.id)
      : undefined;

  validatePlatformButton.disabled = true;
  validateAllButton.disabled = true;
  statusText.textContent = scope === "platform" ? "Validating current platform" : "Validating all endpoints";

  try {
    const response = await fetch("/api/health-report/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpointIds }),
    });
    const body = await response.json();
    applyHealthReport(body.data);
    responseBody.textContent = pretty(body.data);
    statusText.textContent = "Validation complete";
  } catch (error) {
    statusText.textContent = "Validation failed";
    responseBody.textContent = error.stack || error.message;
  } finally {
    validatePlatformButton.disabled = false;
    validateAllButton.disabled = false;
  }
}

function setStatusFilter(status) {
  state.statusFilter = status;
  state.endpoint = null;
  renderPlatforms();
  renderEndpoints();
}

platformList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-platform]");
  if (!button) return;
  state.platformId = button.dataset.platform;
  state.endpoint = null;
  renderPlatforms();
  renderEndpoints();
});

statusFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-status-filter]");
  if (!button) return;
  setStatusFilter(button.dataset.statusFilter);
});

healthSummary.addEventListener("click", (event) => {
  const button = event.target.closest("[data-health-filter]");
  if (!button) return;
  setStatusFilter(button.dataset.healthFilter);
});

endpointList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-endpoint]");
  if (!button) return;
  selectEndpoint(state.endpoints.find((endpoint) => endpoint.id === button.dataset.endpoint));
});

sendButton.addEventListener("click", sendRequest);
copyButton.addEventListener("click", copyRequest);
saveConfigButton.addEventListener("click", saveConfig);
validatePlatformButton.addEventListener("click", () => runHealthReport("platform"));
validateAllButton.addEventListener("click", () => runHealthReport("all"));
searchInput.addEventListener("input", () => {
  state.search = searchInput.value.trim();
  renderPlatforms();
  renderEndpoints();
});

async function boot() {
  const response = await fetch("/api/catalog");
  const catalog = await response.json();
  state.platforms = catalog.platforms;
  state.endpoints = catalog.endpoints;
  await loadHealthReport();
  renderPlatforms();
  renderEndpoints();
}

boot().catch((error) => {
  statusText.textContent = "Boot failed";
  responseBody.textContent = error.stack || error.message;
});
