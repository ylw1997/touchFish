import type { WebviewApi } from "vscode-webview";

class VSCodeAPIWrapper {
  private readonly vsCodeApi: WebviewApi<unknown> | undefined;

  constructor() {
    if (typeof acquireVsCodeApi === "function") {
      const g = window as any;
      if (!g.__touchfish_vscode_api__) {
        try {
          g.__touchfish_vscode_api__ = acquireVsCodeApi();
        } catch (e) {
          console.warn("acquireVsCodeApi failed or already acquired:", e);
        }
      }
      this.vsCodeApi = g.__touchfish_vscode_api__;
    }
  }

  public postMessage(message: unknown) {
    if (this.vsCodeApi) {
      this.vsCodeApi.postMessage(message);
    } else {
      console.log("Mock postMessage:", message);
    }
  }

  public getState(): unknown | undefined {
    if (this.vsCodeApi) {
      return this.vsCodeApi.getState();
    } else {
      const state = localStorage.getItem("douyinVscodeState");
      return state ? JSON.parse(state) : undefined;
    }
  }

  public setState<T extends unknown | undefined>(newState: T): T {
    if (this.vsCodeApi) {
      return this.vsCodeApi.setState(newState);
    } else {
      localStorage.setItem("douyinVscodeState", JSON.stringify(newState));
      return newState;
    }
  }
}

export const vscode = new VSCodeAPIWrapper();
