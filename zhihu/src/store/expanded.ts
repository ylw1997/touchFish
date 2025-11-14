/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-11-13 17:52:14
 * @LastEditTime: 2025-11-14 10:18:03
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\store\expanded.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
import { create } from 'zustand';

export interface ExpandedState {
  items: Record<string, () => void>; // id -> collapse callback
  register: (id: string, collapse: () => void) => void;
  unregister: (id: string) => void;
  collapseAll: () => void;
}

export const useExpandedStore = create<ExpandedState>((set, get) => ({
  items: {},
  register: (id, collapse) => {
    set(state => ({ items: { ...state.items, [id]: collapse } }));
  },
  unregister: (id) => {
    set(state => {
      if (!(id in state.items)) return state;
      const items = { ...state.items };
      delete items[id];
      return { items };
    });
  },
  collapseAll: () => {
    const { items } = get();
    // 调用所有回调折叠
    Object.values(items).forEach(cb => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      try { cb(); } catch (e) { /* 忽略单项错误 */ }
    });
    // 清空注册列表
    set({ items: {} });
  }
}));

export const useHasExpanded = () => useExpandedStore(state => Object.keys(state.items).length > 0);
