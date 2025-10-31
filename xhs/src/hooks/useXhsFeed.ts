/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 10:05:42
 * @LastEditTime: 2025-10-31 15:52:52
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
import { XhsFeedRawItem, XhsFeedRawResponse } from "../../../type";



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

  const { request } = useRequest();
  // 固定 API 实例，避免每次 render 新建导致 useCallback 频繁变更
  const apiRef = useRef(createXhsApi(request));
  const load = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const nextCursor = reset ? "" : cursor;
        // 通过统一的 createXhsApi 封装调用后端命令
        const res: XhsFeedRawResponse = await apiRef.current.getHomeFeed({
          cursor: nextCursor,
        });
        const incoming = res.items || [];
        setItems((prev) => (reset ? incoming : [...prev, ...incoming]));
        setCursor(res.cursor_score || "");
        // 没有 has_more 字段时：当返回空数组则认为结束
        setHasMore(incoming.length > 0);
      } catch (e: any) {
        setError(e?.message || "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [cursor]
  );
  // 先定义 clear，供 refresh 使用
  const clear = useCallback(() => {
    setItems([]); // 立即清空，Feed 中会显示加载占位
    setCursor("");
    setHasMore(true);
  }, []);

  const refresh = useCallback(async () => {
    // 刷新时先清空旧数据，提升“正在加载”反馈
    clear();
    await load(true);
  }, [clear, load]);

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
