/*
 * 小红书 feed 数据加载 Hook
 * 模仿 weibo 下的 useWeiboAction：负责滚动加载、并发控制、刷新、错误处理占位。
 */
import { useCallback, useRef, useState } from 'react';
import { fetchFeed } from '../api';

export interface XhsFeedRawItem { id?: string; [k: string]: any }
export interface XhsFeedRawResponse { items?: XhsFeedRawItem[]; cursor_score?: string; has_more?: boolean }

interface UseXhsFeedOptions {
  /** 初始光标 */
  initialCursor?: string;
  /** 是否自动去重（根据 id） */
  dedupe?: boolean;
}

export function useXhsFeed(options: UseXhsFeedOptions = {}) {
  const { initialCursor = '', dedupe = true } = options;
  const [items, setItems] = useState<XhsFeedRawItem[]>([]);
  const [cursor, setCursor] = useState<string>(initialCursor);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadingRef = useRef(false);
  const idSetRef = useRef<Set<string>>(new Set());

  const mapIncoming = useCallback((arr: XhsFeedRawItem[] | undefined) => {
    if (!arr || arr.length === 0) return [];
    if (!dedupe) return arr.map(it => ({ ...it, id: it.id || Math.random().toString(36).slice(2) }));
    return arr.map(raw => {
      const id = raw.id || Math.random().toString(36).slice(2);
      raw.id = id; // 直接附加 id 以便后续组件使用
      return raw;
    }).filter(it => {
      if (!it.id) return true; // 理论不发生
      if (idSetRef.current.has(it.id)) return false;
      idSetRef.current.add(it.id);
      return true;
    });
  }, [dedupe]);

  const load = useCallback(async (reset = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const nextCursor = reset ? '' : cursor;
      const res: XhsFeedRawResponse = await fetchFeed(nextCursor);
      const mapped = mapIncoming(res.items);
      setItems(prev => reset ? mapped : [...prev, ...mapped]);
      setCursor(res.cursor_score || '');
      setHasMore(res.has_more !== false && (res.items?.length || 0) > 0);
    } catch (e: any) {
      console.error('[useXhsFeed] load error', e);
      setError(e?.message || '加载失败');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [cursor, mapIncoming]);

  const refresh = useCallback(async () => {
    // 清理去重集合
    idSetRef.current.clear();
    setCursor('');
    await load(true);
  }, [load]);

  const clear = useCallback(() => {
    idSetRef.current.clear();
    setItems([]);
    setCursor('');
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