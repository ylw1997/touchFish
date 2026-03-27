import * as crypto from "crypto-js";

export function createSandboxRequire(moduleName: string) {
  if (moduleName === "crypto-js") {
    return crypto;
  }
  throw new Error(`Sandbox does not allow requiring module: ${moduleName}`);
}

export function extractA1FromCookie(cookie: string): string {
  const match = cookie.match(/(?:^|;\s*)a1=([^;]+)/);
  return match ? match[1] : "";
}
