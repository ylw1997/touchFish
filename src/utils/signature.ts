/* eslint-disable @typescript-eslint/no-require-imports */
/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-05 08:51:35
 * @LastEditTime: 2025-10-22 15:34:32
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\utils\signature.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import * as path from "path";
import * as fs from "fs";
import * as vm from "vm";
import * as crypto from "crypto-js";

export function getZhihuSignature(dataToSign: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const zhihuScriptPath = path.join(__dirname, "zhihu.js");
      const zhihuScriptCode = fs.readFileSync(zhihuScriptPath, "utf8");

      // 为沙箱环境创建一个'require'函数，只允许加载'crypto-js'
      const sandboxRequire = (moduleName: string) => {
        if (moduleName === "crypto-js") {
          return crypto;
        }
        throw new Error(
          `Sandbox does not allow requiring module: ${moduleName}`
        );
      };

      // 创建沙箱，并注入必要的模块和变量
      const sandbox = {
        require: sandboxRequire,
        module: { exports: {} },
        console: console, // 脚本可能会使用console
      };

      const context = vm.createContext(sandbox);

      // 在沙箱中执行 zhihu.js
      vm.runInContext(zhihuScriptCode, context);

      // 从沙箱的 module.exports 中获取脚本的导出
      const zhihuModule = context.module.exports as any;

      if (typeof zhihuModule.encrypt !== "function") {
        return reject(
          new Error('zhihu.js did not export an "encrypt" function.')
        );
      }

      // 调用加密函数并返回结果
      const signature = zhihuModule.encrypt(dataToSign);
      resolve(signature);
    } catch (e: any) {
      reject(new Error(`Failed to execute zhihu.js in sandbox: ${e.message}`));
    }
  });
}

// 小红书签名生成：调用 xhs/xhs.js 中导出的 mainSafe/main
// 返回 { 'X-s': string; 'X-t': string }
export interface XhsSignature {
  xs: string;
  xt: string;
  xs_common?: string;
}

export function getXhsSignature(
  apiPath: string,
  payload: any,
  cookie?: string
): Promise<XhsSignature> {
  return new Promise((resolve, reject) => {
    try {
      const xhsScriptPath = path.join(__dirname, "xhs.js");
      const xhsScriptCode = fs.readFileSync(xhsScriptPath, "utf8");
      const sandbox = {
        module: { exports: {} },
        console: console,
        Buffer: Buffer,
        atob,
        btoa,
        require: (moduleName: string) => {
          if (moduleName === "jsdom") {
            return (() => {
              try {
                return require("jsdom");
              } catch (e) {
                console.warn("JSDOM not available:", e);
                return null;
              }
            })();
          }
          throw new Error(`Module ${moduleName} not allowed in sandbox`);
        },
      };
      const context = vm.createContext(sandbox);
      vm.runInContext(xhsScriptCode, context, { timeout: 3000 });
      const exported: any = context.module.exports || {};
      const signer = exported.get_request_headers_params;
      if (typeof signer !== "function") {
        return reject(new Error("xhs.js 未导出 get_request_headers_params 方法"));
      }
      // 解析 cookie 中的 a1 值
      let a1: string | undefined;
      if (cookie) {
        const m = cookie.match(/(?:^|;\s*)a1=([^;]+)/);
        if (m) a1 = m[1];
      }
      if (!a1) {
        console.warn("[xhs] 未在 Cookie 中解析到 a1，使用脚本内默认 a1 可能导致签名失效");
      }
      const result = signer(apiPath, payload, a1);
      const xs: string | undefined = result.xs;
      const xt: string | undefined = result.xt;
      const xs_common: string | undefined = result.xs_common;
      if (!xs || !xt) {
        return reject(new Error('签名结果缺少 xs/xt'));
      }
      resolve(xs_common ? { xs, xt, xs_common } : { xs, xt });
    } catch (e: any) {
      reject(new Error(`执行本地 xhs.js 失败: ${e.message}`));
    }
  });
}
