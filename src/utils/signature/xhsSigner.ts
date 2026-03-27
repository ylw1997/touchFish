/* eslint-disable @typescript-eslint/no-require-imports */
import * as path from "path";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { extractA1FromCookie } from "./shared";

const xhsCode = require("../xhs.raw.js");

const XHS_RESULT_MARKER = "__XHS_RESULT__";
const XHS_READY_TYPE = "ready";
const XHS_SIGN_TYPE = "sign";
const XHS_ERROR_TYPE = "error";
const XHS_INIT_TYPE = "init";
const XHS_VIRTUAL_FILENAME = path.join(__dirname, "xhs.raw.js");
const XHS_REQUEST_TIMEOUT_MS = 15000;
const XHS_RUNNER_CODE = `
  const readline = require("readline");
  const path = require("path");
  const { Module, createRequire } = require("module");

  let signer = null;

  global.console = {
    log() {},
    info() {},
    warn() {},
    error() {},
    debug() {},
  };

  function reply(message) {
    process.stdout.write(JSON.stringify(message) + "\\n");
  }

  function loadSigner(source, virtualFilename) {
    const signerModule = new Module(virtualFilename, module.parent || module);
    signerModule.filename = virtualFilename;
    signerModule.paths = Module._nodeModulePaths(path.dirname(virtualFilename));
    signerModule.require = createRequire(virtualFilename);
    signerModule._compile(source, virtualFilename);
    return signerModule.exports;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  rl.on("line", (line) => {
    if (!line) return;

    try {
      const message = JSON.parse(line);

      if (message.type === "${XHS_INIT_TYPE}") {
        signer = loadSigner(message.source, message.virtualFilename);
        reply({ type: "${XHS_READY_TYPE}" });
        return;
      }

      if (message.type === "${XHS_SIGN_TYPE}") {
        if (!signer || typeof signer.get_request_headers_params !== "function") {
          throw new Error("xhs signer is not initialized");
        }

        const result = signer.get_request_headers_params(
          message.apiPath,
          message.payload,
          message.a1 || "",
          message.method
        );

        reply({
          type: "${XHS_RESULT_MARKER}",
          id: message.id,
          result,
        });
      }
    } catch (error) {
      reply({
        type: "${XHS_ERROR_TYPE}",
        id: (() => {
          try {
            return JSON.parse(line).id;
          } catch {
            return undefined;
          }
        })(),
        error: error && error.message ? error.message : String(error),
      });
    }
  });
`;

export interface XhsSignature {
  xs: string;
  xt: string;
  xs_common: string;
}

type PendingXhsRequest = {
  resolve: (value: XhsSignature) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
};

class XhsSignerWorker {
  private child: ChildProcessWithoutNullStreams | null = null;
  private readyPromise: Promise<void> | null = null;
  private readyResolve: (() => void) | null = null;
  private readyReject: ((error: Error) => void) | null = null;
  private stdoutBuffer = "";
  private stderrBuffer = "";
  private nextId = 1;
  private pending = new Map<number, PendingXhsRequest>();

  constructor() {
    process.once("exit", () => {
      this.dispose();
    });
  }

  async sign(
    apiPath: string,
    payload: any,
    a1: string,
    method: "GET" | "POST"
  ): Promise<XhsSignature> {
    await this.ensureReady();

    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const timeout = setTimeout(() => {
        this.failWorker(new Error("xhs signer request timed out"));
      }, XHS_REQUEST_TIMEOUT_MS);

      this.pending.set(id, { resolve, reject, timeout });
      this.write({
        type: XHS_SIGN_TYPE,
        id,
        apiPath,
        payload,
        a1,
        method,
      });
    });
  }

  private ensureReady(): Promise<void> {
    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.child = spawn(process.execPath, ["-e", XHS_RUNNER_CODE], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.stdoutBuffer = "";
    this.stderrBuffer = "";

    this.child.stdout.on("data", (chunk) => {
      this.stdoutBuffer += chunk.toString();
      this.flushStdoutLines();
    });

    this.child.stderr.on("data", (chunk) => {
      this.stderrBuffer += chunk.toString();
    });

    this.child.on("error", (error) => {
      this.failWorker(new Error(error.message));
    });

    this.child.on("close", (code) => {
      const details =
        this.stderrBuffer.trim() ||
        this.stdoutBuffer.trim() ||
        `exit code ${code}`;
      this.failWorker(new Error(details));
    });

    this.readyPromise = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });

    this.write({
      type: XHS_INIT_TYPE,
      source: xhsCode,
      virtualFilename: XHS_VIRTUAL_FILENAME,
    });

    return this.readyPromise;
  }

  private write(message: Record<string, any>) {
    if (!this.child) {
      throw new Error("xhs signer worker is not started");
    }
    this.child.stdin.write(JSON.stringify(message) + "\n", "utf8");
  }

  private flushStdoutLines() {
    let newlineIndex = this.stdoutBuffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = this.stdoutBuffer.slice(0, newlineIndex).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(newlineIndex + 1);
      if (line) {
        this.handleWorkerLine(line);
      }
      newlineIndex = this.stdoutBuffer.indexOf("\n");
    }
  }

  private handleWorkerLine(line: string) {
    let message: any;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }

    if (message.type === XHS_READY_TYPE) {
      this.readyResolve?.();
      this.readyResolve = null;
      this.readyReject = null;
      return;
    }

    if (message.type === XHS_RESULT_MARKER) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      clearTimeout(pending.timeout);

      const result = message.result;
      if (!result?.xs || !result?.xt || !result?.xs_common) {
        pending.reject(
          new Error("signature result missing xs/xt/xs_common")
        );
        return;
      }

      pending.resolve({
        xs: result.xs,
        xt: String(result.xt),
        xs_common: result.xs_common,
      });
      return;
    }

    if (message.type === XHS_ERROR_TYPE) {
      if (message.id !== undefined && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id)!;
        this.pending.delete(message.id);
        clearTimeout(pending.timeout);
        pending.reject(new Error(message.error || "unknown worker error"));
        return;
      }

      this.failWorker(new Error(message.error || "unknown worker error"));
    }
  }

  private failWorker(error: Error) {
    this.readyReject?.(error);
    this.readyResolve = null;
    this.readyReject = null;
    this.readyPromise = null;

    for (const [, pending] of this.pending) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this.pending.clear();

    this.dispose();
  }

  private dispose() {
    if (!this.child) {
      return;
    }

    this.child.removeAllListeners();
    this.child.stdout.removeAllListeners();
    this.child.stderr.removeAllListeners();
    this.child.kill();
    this.child = null;
  }
}

const xhsSignerWorker = new XhsSignerWorker();

export async function getXhsSignature(
  apiPath: string,
  payload: any,
  cookie: string,
  method: "GET" | "POST" = "POST"
): Promise<XhsSignature> {
  try {
    return await xhsSignerWorker.sign(
      apiPath,
      payload,
      extractA1FromCookie(cookie),
      method
    );
  } catch (e: any) {
    throw new Error(`Failed to execute xhs signature: ${e.message}`);
  }
}
