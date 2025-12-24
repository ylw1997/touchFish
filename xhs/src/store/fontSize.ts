/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-12-24 16:30:00
 * @LastEditTime: 2025-12-24 16:30:00
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\store\fontSize.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description: Global font size store for XHS
 */
import { create } from "zustand";
import { vscode } from "../utils/vscode";

interface FontSizeState {
  fontSize: number;
  increase: () => void;
  decrease: () => void;
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
