import axios from "axios";

export const UserAgentForWeb = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36";

function stringifyQuery(
  query: Record<string, string | number | boolean> = {},
): Record<string, string> {
  const data: Record<string, string> = {};
  Object.keys(query).reduce((obj, key) => {
    obj[key] = query[key].toString();
    return obj;
  }, data);
  return data;
}

// 模拟 fetch 的返回对象
class MockResponse {
  constructor(private data: any, public headers: any = {}) {}
  async json() {
    return typeof this.data === 'string' ? JSON.parse(this.data) : this.data;
  }
  async text() {
    return typeof this.data === 'string' ? this.data : JSON.stringify(this.data);
  }
  getSetCookie(): string[] {
    const setCookie = this.headers["set-cookie"];
    if (Array.isArray(setCookie)) {
      return setCookie;
    }
    if (typeof setCookie === "string") {
      return [setCookie];
    }
    return [];
  }
}

export async function get(
  url: string,
  query: Record<string, string | number> = {},
  header: Record<string, string> = {},
) {
  if (Object.keys(query).length) {
    url += "?" + new URLSearchParams(stringifyQuery(query)).toString();
  }
  const headers: Record<string, string> = {
    "User-Agent": UserAgentForWeb,
    ...header,
  };
  const res = await axios.get(url, { headers, responseType: "text" });
  return new MockResponse(res.data, res.headers as any);
}

async function post(
  url: string,
  data: Record<string, any> = {},
  format = "json",
  header: Record<string, string> = {},
) {
  const headers: Record<string, string> = {
    "User-Agent": UserAgentForWeb,
    ...header,
  };

  let body;
  if (format === "query" && Object.keys(data).length) {
    url += "?" + new URLSearchParams(stringifyQuery(data)).toString();
  } else if (format === "json") {
    body = data;
    headers["Content-Type"] = "application/json";
  } else if (format === "form-data") {
    body = data; // axios handles form data implicitly with correct headers or we can use URLSearchParams
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  
  const res = await axios.post(url, body, { headers, responseType: "text" });
  return new MockResponse(res.data, res.headers as any);
}

export function postJSON(
  url: string,
  data: Record<string, any> = {},
  headers: Record<string, string> = {},
) {
  return post(url, data, "json", headers);
}

export function postQuery(
  url: string,
  data: Record<string, string | number | boolean> = {},
  headers: Record<string, string> = {},
) {
  return post(url, data, "query", headers);
}

export function postFormData(
  url: string,
  data: Record<string, string | number | boolean> = {},
  headers: Record<string, string> = {},
) {
  return post(url, data, "form-data", headers);
}
