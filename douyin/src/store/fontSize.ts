import { create } from "zustand";
import { vscode } from "../utils/vscode";

interface FontSizeState {
  fontSize: number;
  increase: () => void;
  decrease: () => void;
}

// 抖音也支持 VS Code 用户调整全局字体大小
declare global {
  interface Window {
    fontSize?: number;
  }
}

export const useFontSizeStore = create<FontSizeState>((set) => ({
  fontSize: window.fontSize || 14,
  increase: () =>
    set((state) => {
      const newSize = state.fontSize + 1;
      vscode.postMessage({ command: "SAVE_FONT_SIZE", payload: newSize });
      return { fontSize: newSize };
    }),
  decrease: () =>
    set((state) => {
      const newSize = Math.max(12, state.fontSize - 1);
      vscode.postMessage({ command: "SAVE_FONT_SIZE", payload: newSize });
      return { fontSize: newSize };
    }),
}));
