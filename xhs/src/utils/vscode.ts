/*
 * @Description: 与 weibo 复用的 VSCode Webview API 包装，用于在浏览器调试时降级
 */
import type { WebviewApi } from 'vscode-webview';

class VSCodeAPIWrapper {
  private readonly vsCodeApi: WebviewApi<unknown> | undefined;
  constructor() {
    if (typeof acquireVsCodeApi === 'function') {
      this.vsCodeApi = acquireVsCodeApi();
    }
  }
  public postMessage(message: unknown) {
    if (this.vsCodeApi) {
      this.vsCodeApi.postMessage(message);
    } else {
      console.log('[xhs web debug] postMessage', message);
    }
  }
  public getState(): unknown | undefined {
    if (this.vsCodeApi) return this.vsCodeApi.getState();
    const state = localStorage.getItem('xhsWebviewState');
    return state ? JSON.parse(state) : undefined;
  }
  public setState<T extends unknown | undefined>(newState: T): T {
    if (this.vsCodeApi) return this.vsCodeApi.setState(newState);
    localStorage.setItem('xhsWebviewState', JSON.stringify(newState));
    return newState;
  }
}
export const vscode = new VSCodeAPIWrapper();
