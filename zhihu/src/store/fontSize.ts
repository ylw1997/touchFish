/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-12-24 15:50:00
 * @LastEditTime: 2025-12-24 15:50:00
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\store\fontSize.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description: Global font size store
 */
import { create } from "zustand";

interface FontSizeState {
  fontSize: number;
  increase: () => void;
  decrease: () => void;
}

export const useFontSizeStore = create<FontSizeState>((set) => ({
  fontSize: 14,
  increase: () => set((state) => ({ fontSize: state.fontSize + 1 })),
  decrease: () =>
    set((state) => ({ fontSize: Math.max(12, state.fontSize - 1) })), // Prevent too small
}));
