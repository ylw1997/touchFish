import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { vscode } from "../utils/vscode";

interface FontSizeState {
  fontSize: number;
  readerFontSize: number;
  setFontSize: (size: number) => void;
  increase: () => void;
  decrease: () => void;
  increaseReader: () => void;
  decreaseReader: () => void;
}

export const useFontSizeStore = create<FontSizeState>()(
  persist(
    (set, get) => ({
      fontSize: 14,
      readerFontSize: 18,

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

      increaseReader: () => {
        set({ readerFontSize: Math.min(get().readerFontSize + 1, 32) });
      },

      decreaseReader: () => {
        set({ readerFontSize: Math.max(get().readerFontSize - 1, 12) });
      },
    }),
    {
      name: "weread-fontsize-storage",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: any) => ({
        ...persistedState,
        readerFontSize:
          persistedState?.readerFontSize ?? persistedState?.fontSize ?? 18,
      }),
    },
  )
);
