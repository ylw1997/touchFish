const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { Module, createRequire } = require("node:module");
const { spawn } = require("node:child_process");

const zhihuCode = fs.readFileSync(path.join(__dirname, "..", "..", "src", "utils", "zhihu.raw.js"), "utf8");
const xhsCode = fs.readFileSync(path.join(__dirname, "..", "..", "src", "utils", "xhs.raw.js"), "utf8");

let zhihuEncrypt;

function createSandboxRequire(moduleName) {
  if (moduleName === "crypto-js") {
    return require("crypto-js");
  }
  throw new Error(`Sandbox does not allow requiring module: ${moduleName}`);
}

async function getZhihuSignature(value) {
  if (!zhihuEncrypt) {
    const sandbox = {
      require: createSandboxRequire,
      module: { exports: {} },
    };
    vm.createContext(sandbox);
    new vm.Script(zhihuCode).runInContext(sandbox);
    if (typeof sandbox.module.exports.encrypt !== "function") {
      throw new Error('zhihu raw script did not export an "encrypt" function');
    }
    zhihuEncrypt = sandbox.module.exports.encrypt;
  }
  return zhihuEncrypt(value);
}

function extractA1FromCookie(cookie) {
  return cookie.match(/(?:^|;\s*)a1=([^;]+)/)?.[1] || "";
}

const XHS_RUNNER_CODE = `
  const readline = require("readline");
  const path = require("path");
  const crypto = require("crypto");
  const { Module, createRequire } = require("module");
  let signer = null;
  global.console = { log(){}, info(){}, warn(){}, error(){}, debug(){} };
  function reply(message) { process.stdout.write(JSON.stringify(message) + "\\n"); }
  function loadSigner(source, virtualFilename) {
    const compatCryptoJs = {
      MD5(value) {
        const digest = crypto.createHash("md5").update(String(value)).digest("hex");
        return { toString() { return digest; } };
      },
    };
    const signerModule = new Module(virtualFilename, module.parent || module);
    signerModule.filename = virtualFilename;
    signerModule.paths = Module._nodeModulePaths(path.dirname(virtualFilename));
    const runtimeRequire = createRequire(virtualFilename);
    signerModule.require = (moduleName) => moduleName === "crypto-js" ? compatCryptoJs : runtimeRequire(moduleName);
    signerModule._compile(source, virtualFilename);
    return signerModule.exports;
  }
  readline.createInterface({ input: process.stdin, crlfDelay: Infinity }).on("line", (line) => {
    if (!line) return;
    try {
      const message = JSON.parse(line);
      if (message.type === "init") {
        signer = loadSigner(message.source, message.virtualFilename);
        reply({ type: "ready" });
        return;
      }
      if (message.type === "sign") {
        const result = signer.get_request_headers_params(message.apiPath, message.payload, message.a1 || "", message.method);
        reply({ type: "result", id: message.id, result });
      }
    } catch (error) {
      let id;
      try { id = JSON.parse(line).id; } catch {}
      reply({ type: "error", id, error: error && error.message ? error.message : String(error) });
    }
  });
`;

class XhsSignerWorker {
  constructor() {
    this.child = null;
    this.readyPromise = null;
    this.stdoutBuffer = "";
    this.stderrBuffer = "";
    this.nextId = 1;
    this.pending = new Map();
  }

  async sign(apiPath, payload, cookie, method = "POST") {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const timeout = setTimeout(() => {
        this.fail(new Error("xhs signer request timed out"));
      }, 15000);
      this.pending.set(id, { resolve, reject, timeout });
      this.write({
        type: "sign",
        id,
        apiPath,
        payload,
        a1: extractA1FromCookie(cookie),
        method,
      });
    });
  }

  ensureReady() {
    if (this.readyPromise) return this.readyPromise;

    this.child = spawn(process.execPath, ["-e", XHS_RUNNER_CODE], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.child.stdout.on("data", (chunk) => {
      this.stdoutBuffer += chunk.toString();
      this.flush();
    });
    this.child.stderr.on("data", (chunk) => {
      this.stderrBuffer += chunk.toString();
    });
    this.child.on("error", (error) => this.fail(error));
    this.child.on("close", (code) => this.fail(new Error(this.stderrBuffer.trim() || `xhs signer exited: ${code}`)));

    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    this.write({
      type: "init",
      source: xhsCode,
      virtualFilename: path.join(__dirname, "xhs.raw.js"),
    });
    return this.readyPromise;
  }

  write(message) {
    this.child.stdin.write(JSON.stringify(message) + "\n", "utf8");
  }

  flush() {
    let index = this.stdoutBuffer.indexOf("\n");
    while (index !== -1) {
      const line = this.stdoutBuffer.slice(0, index).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(index + 1);
      if (line) this.handleLine(line);
      index = this.stdoutBuffer.indexOf("\n");
    }
  }

  handleLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (message.type === "ready") {
      this.readyResolve?.();
      this.readyResolve = null;
      this.readyReject = null;
      return;
    }
    if (message.type === "result") {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      clearTimeout(pending.timeout);
      if (!message.result?.xs || !message.result?.xt || !message.result?.xs_common) {
        pending.reject(new Error("signature result missing xs/xt/xs_common"));
        return;
      }
      pending.resolve({
        xs: message.result.xs,
        xt: String(message.result.xt),
        xs_common: message.result.xs_common,
      });
      return;
    }
    if (message.type === "error") {
      const pending = this.pending.get(message.id);
      if (pending) {
        this.pending.delete(message.id);
        clearTimeout(pending.timeout);
        pending.reject(new Error(message.error));
      }
    }
  }

  fail(error) {
    this.readyReject?.(error);
    this.readyPromise = null;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();
    this.child?.kill();
    this.child = null;
  }
}

const xhsWorker = new XhsSignerWorker();
let xhsSignerModule;

function getXhsSignerModule() {
  if (xhsSignerModule) return xhsSignerModule;
  const virtualFilename = path.join(__dirname, "xhs.raw.js");
  const signerModule = new Module(virtualFilename, module.parent || module);
  signerModule.filename = virtualFilename;
  signerModule.paths = Module._nodeModulePaths(path.dirname(virtualFilename));
  const runtimeRequire = createRequire(virtualFilename);
  const compatCryptoJs = {
    MD5(value) {
      const digest = crypto.createHash("md5").update(String(value)).digest("hex");
      return { toString: () => digest };
    },
  };
  signerModule.require = (moduleName) => (moduleName === "crypto-js" ? compatCryptoJs : runtimeRequire(moduleName));
  signerModule._compile(xhsCode, virtualFilename);
  xhsSignerModule = signerModule.exports;
  return xhsSignerModule;
}

async function getXhsSignature(apiPath, payload, cookie, method = "POST") {
  const signer = getXhsSignerModule();
  const result = signer.get_request_headers_params(apiPath, payload, extractA1FromCookie(cookie), method);
  if (!result?.xs || !result?.xt || !result?.xs_common) {
    throw new Error("signature result missing xs/xt/xs_common");
  }
  return {
    xs: result.xs,
    xt: String(result.xt),
    xs_common: result.xs_common,
  };
}

function buildXCredential({ cookie, authorization }) {
  return {
    cookie,
    authorization,
    csrfToken: cookie.match(/ct0=([^;]+)/)?.[1] || "",
  };
}

function buildXHeaders(credential, extraHeaders = {}) {
  return {
    accept: "*/*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    authorization: credential.authorization || "",
    cookie: credential.cookie,
    "content-type": "application/json",
    referer: "https://x.com/home",
    "x-csrf-token": credential.csrfToken,
    "x-twitter-active-user": "yes",
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-client-language": "zh-cn",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    ...extraHeaders,
  };
}

async function getXTransactionId(pathname, method) {
  const { ClientTransaction, handleXMigration } = require("x-client-transaction-id");
  if (!getXTransactionId.instance) {
    const document = await handleXMigration();
    getXTransactionId.instance = await ClientTransaction.create(document);
  }
  return getXTransactionId.instance.generateTransactionId(method, pathname);
}

module.exports = {
  buildXCredential,
  buildXHeaders,
  getXTransactionId,
  getXhsSignature,
  getZhihuSignature,
};
