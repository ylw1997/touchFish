/*
 * 增强版 messageHandler：支持超时、错误码检查与显式 reject
 */
declare function acquireVsCodeApi(): { postMessage: (msg: any) => void } | undefined;

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeoutId: number;
}

class MessageHandler {
  private pendingRequests = new Map<string, PendingRequest>();
  private vscode: { postMessage: (msg: any) => void } | undefined;
  private static instance: MessageHandler;

  private constructor() {
    this.vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;
    window.addEventListener('message', this.handleMessage.bind(this));
  }

  public static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }
    return MessageHandler.instance;
  }

  private handleMessage(ev: MessageEvent) {
    const { uuid, payload } = (ev.data || {}) as { uuid?: string; payload?: any };
    if (!uuid) return;
    const pending = this.pendingRequests.get(uuid);
    if (!pending) return;
    clearTimeout(pending.timeoutId);

    if (payload && typeof payload.ok !== 'undefined' && payload.ok !== 1) {
      pending.reject(new Error(payload.msg || '请求失败'));
    } else {
      pending.resolve(payload);
    }
    this.pendingRequests.delete(uuid);
  }

  public addRequest(
    uuid: string,
    resolve: (value: any) => void,
    reject: (reason?: any) => void,
    timeout: number = 30000
  ) {
    const timeoutId = window.setTimeout(() => {
      this.pendingRequests.delete(uuid);
      reject(new Error('Request timed out'));
    }, timeout);
    this.pendingRequests.set(uuid, { resolve, reject, timeoutId });
  }

  public send<T = any>(command: string, payload?: any, timeout?: number): Promise<T> {
    const uuid = Math.random().toString(36).slice(2);
    return new Promise<T>((resolve, reject) => {
      this.addRequest(uuid, resolve, reject, timeout);
      this.vscode?.postMessage({ command, payload, uuid });
    });
  }
}

export const messageHandler = MessageHandler.getInstance();
