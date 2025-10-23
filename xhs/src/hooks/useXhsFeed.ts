/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 10:05:42
 * @LastEditTime: 2025-10-23 13:47:38
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\hooks\useXhsFeed.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
/*
 * 小红书 feed 数据加载 Hook
 * 模仿 weibo 下的 useWeiboAction：负责滚动加载、并发控制、刷新、错误处理占位。
 */
import { useCallback, useRef, useState } from "react";
import { createXhsApi } from "../api";
import { useRequest } from "./useRequest";

export interface XhsFeedRawItem {
  id?: string;
  [k: string]: any;
}
export interface XhsFeedRawResponse {
  items?: XhsFeedRawItem[];
  cursor_score?: string;
}

interface UseXhsFeedOptions {
  /** 初始光标 */
  initialCursor?: string;
}

export function useXhsFeed(options: UseXhsFeedOptions = {}) {
  const { initialCursor = "" } = options;
  const [items, setItems] = useState<XhsFeedRawItem[]>([]);
  const [cursor, setCursor] = useState<string>(initialCursor);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadingRef = useRef(false);
  const { request } = useRequest();
  // 固定 API 实例，避免每次 render 新建导致 useCallback 频繁变更
  const apiRef = useRef(createXhsApi(request));
  const load = useCallback(
    async (reset = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const nextCursor = reset ? "" : cursor;
        // 通过统一的 createXhsApi 封装调用后端命令
        console.debug('[useXhsFeed] load start', { reset, cursor: nextCursor });
        const res: XhsFeedRawResponse = await apiRef.current.getHomeFeed({
          cursor: nextCursor,
        });
        const incoming = res.items || [];
        setItems((prev) => (reset ? incoming : [...prev, ...incoming]));
        setCursor(res.cursor_score || "");
        // 没有 has_more 字段时：当返回空数组则认为结束
        setHasMore(incoming.length > 0);
        console.debug('[useXhsFeed] load success', { count: incoming.length, nextCursor: res.cursor_score });
      } catch (e: any) {
        console.error("[useXhsFeed] load error", e);
        setError(e?.message || "加载失败");
      } finally {
        loadingRef.current = false;
        setLoading(false);
        console.debug('[useXhsFeed] load end');
      }
    },
    [cursor]
  );

  const refresh = useCallback(async () => {
    setCursor("");
    await load(true);
  }, [load]);

  const clear = useCallback(() => {
    setItems([]);
    setCursor("");
    setHasMore(true);
  }, []);

  return {
    items,
    cursor,
    loading,
    hasMore,
    error,
    loadMore: load,
    refresh,
    clear,
  };
}

export default useXhsFeed;
