import { useState, useCallback } from "react";
import { useRequest } from "./useRequest";

export function getImageUrl(entity: any) {
  return (
    entity?.image?.smallPicUrl ||
    entity?.image?.middlePicUrl ||
    entity?.image?.picUrl ||
    entity?.podcast?.image?.smallPicUrl ||
    entity?.podcast?.image?.picUrl ||
    entity?.avatar
  );
}

export function getPlayableUrl(episode: any) {
  return (
    episode?.enclosure?.url ||
    episode?.media?.source?.url ||
    episode?.media?.backupSource?.url ||
    ""
  );
}

export function useXiaoyuzhou() {
  const { request } = useRequest();

  const [loading, setLoading] = useState(false);

  // 获取推荐
  const getDiscovery = useCallback(async () => {
    try {
      const result = await request<any>("XIAOYUZHOU_GET_DISCOVERY_FEED", {});
      if (result.code === 0 && result.data) {
        const extractedItems: any[] = [];
        const blocks = Array.isArray(result.data.data) ? result.data.data : Array.isArray(result.data.data?.data) ? result.data.data.data : [];
        const extractRecursive = (node: any) => {
          if (!node || typeof node !== "object") return;
          if (Array.isArray(node)) {
            node.forEach(extractRecursive);
            return;
          }
          if (node.type === "PODCAST" && node.podcast) extractedItems.push(node.podcast);
          else if (node.type === "EPISODE" && node.episode) extractedItems.push(node.episode);
          else if (node.pid && node.title) extractedItems.push(node);
          else if (node.eid && node.title) extractedItems.push(node);
          else {
            Object.values(node).forEach(extractRecursive);
          }
        };
        extractRecursive(blocks);
        return extractedItems;
      }
      return [];
    } catch (e: any) {
      console.error(e);
      return [];
    }
  }, [request]);

  // 获取榜单数据
  const getTopList = useCallback(
    async (category: "HOT" | "ROCK" | "NEW") => {
      setLoading(true);
      try {
        const result = await request<any>("XIAOYUZHOU_GET_TOP_LIST", {
          category,
        });
        if (result.code === 0 && result.data) {
          const extractedItems: any[] = [];
          const extractRecursive = (node: any) => {
            if (!node || typeof node !== "object") return;
            if (Array.isArray(node)) {
              node.forEach(extractRecursive);
              return;
            }
            if (node.item && (node.item.pid || node.item.eid)) extractedItems.push(node.item);
            else {
              Object.values(node).forEach(extractRecursive);
            }
          };
          extractRecursive(result.data);
          return extractedItems;
        }
        return [];
      } catch (e: any) {
        console.error(e);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [request],
  );

  // 搜索
  const doSearch = useCallback(
    async (keyword: string) => {
      setLoading(true);
      try {
        const result = await request<any>("XIAOYUZHOU_SEARCH_PODCASTS", {
          keyword,
        });
        if (result.code === 0 && result.data) {
          return result.data.data || [];
        }
        return [];
      } catch (e: any) {
        console.error(e);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [request],
  );

  const getEpisodeDetail = useCallback(
    async (eid: string) => {
      try {
        const result = await request<any>("XIAOYUZHOU_GET_EPISODE_DETAIL", {
          eid,
        });
        if (result.code === 0 && result.data?.data) {
          return result.data.data;
        }
        return null;
      } catch {
        return null;
      }
    },
    [request],
  );

  const getPodcastDetail = useCallback(
    async (pid: string) => {
      setLoading(true);
      try {
        const [detail, episodes] = await Promise.all([
          request<any>("XIAOYUZHOU_GET_PODCAST_DETAIL", { pid }),
          request<any>("XIAOYUZHOU_GET_EPISODE_LIST", { pid, order: "desc" }),
        ]);
        if (detail.code === 0 && detail.data?.data) {
          return {
            podcast: detail.data.data,
            episodes: episodes.data?.data || [],
          };
        }
        return null;
      } catch {
        return null;
      } finally {
        setLoading(false);
      }
    },
    [request],
  );

  const getSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await request<any>("XIAOYUZHOU_GET_SUBSCRIPTIONS", {});
      if (result.code === 0 && result.data) {
        return Array.isArray(result.data?.data) ? result.data.data : [];
      }
      return [];
    } catch (e: any) {
      console.error(e);
      return [];
    } finally {
      setLoading(false);
    }
  }, [request]);

  return {
    loading,
    getDiscovery,
    getTopList,
    doSearch,
    getEpisodeDetail,
    getPodcastDetail,
    getSubscriptions,
  };
}
