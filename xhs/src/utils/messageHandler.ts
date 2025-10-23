declare function acquireVsCodeApi(): { postMessage: (msg: any) => void } | undefined;

type Resolver = (value: any) => void;
class MessageHandler {
  private pending: Record<string, Resolver> = {};
  private vscode: { postMessage: (msg: any) => void } | undefined;
  constructor() {
    this.vscode = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;
    window.addEventListener('message', (ev: MessageEvent) => {
      const { uuid, payload } = (ev.data || {}) as { uuid?: string; payload?: any };
      if (uuid && this.pending[uuid]) {
        this.pending[uuid](payload);
        delete this.pending[uuid];
      }
    });
  }
  send<T=any>(command: string, payload?: any): Promise<T> {
    const uuid = Math.random().toString(36).slice(2);
    return new Promise<T>((resolve) => {
      this.pending[uuid] = resolve as Resolver;
      this.vscode?.postMessage({ command, payload, uuid });
    });
  }
}
export const messageHandler = new MessageHandler();
