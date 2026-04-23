import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { vscode } from "../utils/vscode";

interface FontSizeState {
  fontSize: number;
  setFontSize: (size: number) => void;
  increase: () => void;
  decrease: () => void;
}

export const useFontSizeStore = create<FontSizeState>()(
  persist(
    (set, get) => ({
      fontSize: 14,

      setFontSize: (size: number) => {
        set({ fontSize: size });
      },

      increase: () => {
        const newSize = Math.min(get().fontSize + 1, 24);
        set({ fontSize: newSize });
        vscode.postMessage({
          command: "SAVE_FONT_SIZE",
          payload: newSize,
        });
      },

      decrease: () => {
        const newSize = Math.max(get().fontSize - 1, 12);
        set({ fontSize: newSize });
        vscode.postMessage({
          command: "SAVE_FONT_SIZE",
          payload: newSize,
        });
      },
    }),
    {
      name: "weread-fontsize-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
