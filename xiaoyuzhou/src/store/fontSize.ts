/**
 * 字体大小状态管理
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { vscode } from "../utils/vscode";

interface FontSizeState {
  fontSize: number;
  increase: () => void;
  decrease: () => void;
}

export const useFontSizeStore = create<FontSizeState>()(
  persist(
    (set, get) => ({
      fontSize: 14,

      increase: () => {
        const newSize = Math.min(get().fontSize + 1, 20);
        set({ fontSize: newSize });
        vscode.postMessage({
          command: "SET_FONTSIZE",
          payload: newSize,
        });
      },

      decrease: () => {
        const newSize = Math.max(get().fontSize - 1, 12);
        set({ fontSize: newSize });
        vscode.postMessage({
          command: "SET_FONTSIZE",
          payload: newSize,
        });
      },
    }),
    {
      name: "qqmusic-fontsize-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
