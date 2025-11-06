/**
 * 小红书搜索逻辑 Hook
 * 封装搜索、加载更多、状态管理等逻辑
 */
import { useState, useCallback, useRef } from "react";
import { createXhsApi } from "../api";
import { generateXB3TraceId } from "../utils/utils";

interface UseXhsSearchOptions {
  request: any;
}

export const useXhsSearch = ({ request }: UseXhsSearchOptions) => {
  const apiRef = useRef(createXhsApi(request));
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchId, setSearchId] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState("");

  // 执行搜索
  const search = useCallback(async (searchKeyword: string) => {
    const trimmed = searchKeyword?.trim();
    if (!trimmed) return;
    
    setLoading(true);
    setKeyword(trimmed);
    setPage(1);
    setResults([]);
    setHasMore(true);
    
    const newSearchId = generateXB3TraceId();
    setSearchId(newSearchId);
    
    try {
      const res: any = await apiRef.current.searchNotes({
        keyword: trimmed,
        page: 1,
        search_id: newSearchId,
      });
      
      const incoming = res?.items || [];
      setResults(incoming);
      setHasMore(res.has_more);
      setPage(2);
    } catch (e) {
      console.error("[xhs search] error", e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载更多
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !keyword) return;
    
    setLoading(true);
    
    try {
      const res: any = await apiRef.current.searchNotes({
        keyword,
        page,
        search_id: searchId,
      });
      
      const incoming = res?.items || [];
      setResults((prev) => [...prev, ...incoming]);
      setHasMore(res.has_more);
      setPage((prev) => prev + 1);
    } catch (e) {
      console.error("[xhs search more] error", e);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page, searchId, keyword]);

  // 重置状态
  const reset = useCallback(() => {
    setResults([]);
    setPage(1);
    setSearchId("");
    setHasMore(true);
    setLoading(false);
    setKeyword("");
  }, []);

  return {
    loading,
    results,
    hasMore,
    search,
    loadMore,
    reset,
  };
};
