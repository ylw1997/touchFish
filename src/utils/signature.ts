/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-05 08:51:35
 * @LastEditTime: 2026-03-27 00:00:00
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\utils\signature.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import * as vm from "vm";
import * as path from "path";
import { execFile } from "child_process";
import * as crypto from "crypto-js";

const zhihuCode = require("./zhihu.raw.js");

let zhihuScript: vm.Script | null = null;

function createSandboxRequire(moduleName: string) {
  if (moduleName === "crypto-js") {
    return crypto;
  }
  throw new Error(`Sandbox does not allow requiring module: ${moduleName}`);
}

function getZhihuScript(): vm.Script {
  if (!zhihuScript) {
    zhihuScript = new vm.Script(zhihuCode);
  }
  return zhihuScript;
}

export function getZhihuSignature(dataToSign: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const sandbox = {
        require: createSandboxRequire,
        module: { exports: {} },
      };

      const context = vm.createContext(sandbox);
      getZhihuScript().runInContext(context);

      const zhihuModule = context.module.exports as any;

      if (typeof zhihuModule.encrypt !== "function") {
        return reject(
          new Error('zhihu.js did not export an "encrypt" function.')
        );
      }

      resolve(zhihuModule.encrypt(dataToSign));
    } catch (e: any) {
      reject(new Error(`Failed to execute zhihu.js in sandbox: ${e.message}`));
    }
  });
}

export interface XhsSignature {
  xs: string;
  xt: string;
  xs_common: string;
}

export function getXhsSignature(
  apiPath: string,
  payload: any,
  cookie: string,
  method: "GET" | "POST" = "POST"
): Promise<XhsSignature> {
  return new Promise((resolve, reject) => {
    let a1 = "";
    if (cookie) {
      const match = cookie.match(/(?:^|;\s*)a1=([^;]+)/);
      if (match) a1 = match[1];
    }

    const xhsRawModulePath = path.join(__dirname, "xhs.raw.js");
    const encodedInput = Buffer.from(
      JSON.stringify({ apiPath, payload, a1, method }),
      "utf8"
    ).toString("base64");

    const runnerCode = `
      const input = JSON.parse(Buffer.from(process.argv[1], "base64").toString("utf8"));
      const signer = require(process.argv[2]);
      const result = signer.get_request_headers_params(
        input.apiPath,
        input.payload,
        input.a1 || "",
        input.method
      );
      process.stdout.write("__XHS_RESULT__" + JSON.stringify(result));
    `;

    execFile(
      process.execPath,
      ["-e", runnerCode, encodedInput, xhsRawModulePath],
      { windowsHide: true, maxBuffer: 1024 * 1024 * 4 },
      (error, stdout, stderr) => {
        if (error) {
          const details = stderr?.trim() || stdout?.trim() || error.message;
          reject(new Error(`Failed to execute xhs signature: ${details}`));
          return;
        }

        const marker = "__XHS_RESULT__";
        const markerIndex = stdout.lastIndexOf(marker);
        if (markerIndex === -1) {
          const details = stderr?.trim() || stdout?.trim() || "empty output";
          reject(new Error(`Failed to execute xhs signature: ${details}`));
          return;
        }

        try {
          const result = JSON.parse(stdout.slice(markerIndex + marker.length));
          if (!result?.xs || !result?.xt || !result?.xs_common) {
            reject(new Error("Failed to execute xhs signature: signature result missing xs/xt/xs_common"));
            return;
          }

          resolve({
            xs: result.xs,
            xt: String(result.xt),
            xs_common: result.xs_common,
          });
        } catch (e: any) {
          reject(new Error(`Failed to execute xhs signature: ${e.message}`));
        }
      }
    );
  });
}
