/* eslint-disable @typescript-eslint/no-require-imports */
import * as vm from "vm";
import { createSandboxRequire } from "./shared";

const zhihuCode = require("../zhihu.raw.js");

let zhihuScript: vm.Script | null = null;
let zhihuEncrypt: ((value: string) => string) | null = null;

function getZhihuScript(): vm.Script {
  if (!zhihuScript) {
    zhihuScript = new vm.Script(zhihuCode);
  }
  return zhihuScript;
}

function getZhihuEncrypt(): (value: string) => string {
  if (zhihuEncrypt) {
    return zhihuEncrypt;
  }

  const sandbox = {
    require: createSandboxRequire,
    module: { exports: {} as { encrypt?: (value: string) => string } },
  };

  const context = vm.createContext(sandbox);
  getZhihuScript().runInContext(context);

  const zhihuModule = context.module.exports as {
    encrypt?: (value: string) => string;
  };

  if (typeof zhihuModule.encrypt !== "function") {
    throw new Error('zhihu.js did not export an "encrypt" function.');
  }

  zhihuEncrypt = zhihuModule.encrypt;
  return zhihuEncrypt;
}

export async function getZhihuSignature(dataToSign: string): Promise<string> {
  try {
    return getZhihuEncrypt()(dataToSign);
  } catch (e: any) {
    throw new Error(`Failed to execute zhihu.js in sandbox: ${e.message}`);
  }
}
