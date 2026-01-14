/*
 * @Description: 推荐视频缓存管理
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { BilibiliListItem } from "../types/bilibili";

interface RecommendCacheState {
  // 缓存的视频列表
  cachedList: BilibiliListItem[];

  // Actions
  setCachedList: (list: BilibiliListItem[]) => void;
  appendCachedList: (list: BilibiliListItem[]) => void;
  clearCache: () => void;
  isCacheValid: () => boolean;
}

export const useRecommendCacheStore = create<RecommendCacheState>()(
  persist(
    (set, get) => ({
      cachedList: [],

      // 设置缓存列表（替换）
      setCachedList: (list) =>
        set({
          cachedList: list,
        }),

      // 追加到缓存列表
      appendCachedList: (list) =>
        set((state) => {
          // 过滤掉已存在的视频（根据id去重）
          const existingIds = new Set(state.cachedList.map((v) => v.id));
          const newItems = list.filter((v) => !existingIds.has(v.id));

          return {
            cachedList: [...state.cachedList, ...newItems],
          };
        }),

      // 清空缓存
      clearCache: () =>
        set({
          cachedList: [],
        }),

      // 检查缓存是否有效（只要有数据就有效）
      isCacheValid: () => {
        const { cachedList } = get();
        return cachedList.length > 0;
      },
    }),
    {
      name: "bilibili-recommend-cache", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cachedList: state.cachedList,
      }),
    }
  )
);
