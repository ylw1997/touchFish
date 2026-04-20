/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2026-04-20
 * @Description: Global config store for XHS (showImg, etc.)
 */
import { create } from "zustand";
import { vscode } from "../utils/vscode";

interface ConfigState {
  showImg: boolean;
  setShowImg: (show: boolean) => void;
  toggleShowImg: () => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  // 初始化从注入的 windowConfig 获取
  showImg: (window as any).windowConfig?.showImg !== false,
  setShowImg: (showImg) => set({ showImg }),
  toggleShowImg: () => {
    const nextState = !get().showImg;
    set({ showImg: nextState });
    vscode.postMessage({
      command: "TOGGLE_SHOW_IMG",
      payload: nextState,
    });
  },
}));
