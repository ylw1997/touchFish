/*
 * @Description: Bilibili 业务逻辑 Hook
 */
import { useCallback, useState, useMemo, useRef } from "react";
import type { BilibiliListItem, DynamicItem } from "../types/bilibili";
import { useRequest } from "./useRequest";
import { BilibiliApi } from "../api";

const useBilibiliAction = () => {
  // 视频列表相关状态
  const [list, setList] = useState<BilibiliListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  // 动态分页相关
  const dynamicPageRef = useRef(1);
  const dynamicOffsetRef = useRef<string | undefined>(undefined);
  const hasMoreRef = useRef(true);

  // 待看分页相关
  const watchLaterPageRef = useRef(1);

  const { request, messageApi } = useRequest();
  const apiClient = useMemo(() => new BilibiliApi(request), [request]);

  // 清空列表
  const clearList = useCallback(() => {
    setList([]);
    dynamicPageRef.current = 1;
    dynamicOffsetRef.current = undefined;
    hasMoreRef.current = true;
    watchLaterPageRef.current = 1;
  }, []);

  // 复制链接
  const copyLink = useCallback(
    (url: string) => {
      navigator.clipboard.writeText(url).then(() => {
        messageApi.success("链接已复制到剪贴板");
      });
    },
    [messageApi]
  );

  // 将动态数据转换为统一的列表项格式
  const convertDynamicToListItem = (
    item: DynamicItem
  ): BilibiliListItem | null => {
    const archive = item.modules.module_dynamic?.major?.archive;
    if (!archive) return null;

    const author = item.modules.module_author;
    // 解析时长 "06:21" -> 秒数
    const durationParts = archive.duration_text.split(":").map(Number);
    let duration = 0;
    if (durationParts.length === 2) {
      duration = durationParts[0] * 60 + durationParts[1];
    } else if (durationParts.length === 3) {
      duration =
        durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2];
    }

    return {
      id: parseInt(archive.aid) || 0,
      bvid: archive.bvid,
      cid: 0,
      uri: `https:${archive.jump_url}`,
      pic: archive.cover.startsWith("http")
        ? archive.cover
        : `https:${archive.cover}`,
      title: archive.title,
      duration,
      pubdate: author.pub_ts,
      pub_time: author.pub_time,
      owner: {
        mid: author.mid,
        name: author.name,
        face: author.face,
      },
      stat: {
        view: parseInt(archive.stat.play) || 0,
        like: item.modules.module_stat.like.count,
        danmaku: parseInt(archive.stat.danmaku) || 0,
      },
      is_followed: author.following ? 1 : 0,
    };
  };

  // 获取列表数据
  const getListData = useCallback(
    async (payload: string, replace = false) => {
      setIsFetching(true);
      try {
        if (payload === "recommend") {
          // 推荐接口
          const result = await apiClient.getRecommend();
          if (result.code === 0 && result.data?.item) {
            const newList: BilibiliListItem[] = result.data.item.map(
              (item) => ({
                id: item.id,
                bvid: item.bvid,
                cid: item.cid,
                uri: item.uri,
                pic: item.pic,
                title: item.title,
                duration: item.duration,
                pubdate: item.pubdate,
                owner: item.owner,
                stat: item.stat,
                is_followed: item.is_followed,
                rcmd_reason: item.rcmd_reason,
              })
            );
            setList((currentList) =>
              replace ? newList : [...currentList, ...newList]
            );
            setTotal(999);
          }
        } else if (payload === "dynamic") {
          // 动态接口
          if (!hasMoreRef.current && !replace) return;

          if (replace) {
            dynamicPageRef.current = 1;
            dynamicOffsetRef.current = undefined;
          }

          const result = await apiClient.getDynamic(
            dynamicPageRef.current,
            dynamicOffsetRef.current
          );

          if (result.code === 0 && result.data?.items) {
            const newList: BilibiliListItem[] = result.data.items
              .map(convertDynamicToListItem)
              .filter((item): item is BilibiliListItem => item !== null);

            setList((currentList) =>
              replace ? newList : [...currentList, ...newList]
            );

            // 更新分页状态
            hasMoreRef.current = result.data.has_more;
            dynamicOffsetRef.current = result.data.offset;
            dynamicPageRef.current += 1;
            setTotal(hasMoreRef.current ? 999 : list.length + newList.length);
          }
        } else if (payload === "watchlater") {
          // 待看接口
          if (replace) {
            watchLaterPageRef.current = 1;
          }

          const result = await apiClient.getWatchLater(
            watchLaterPageRef.current,
            20
          );

          if (result.code === 0 && result.data?.list) {
            const newList: BilibiliListItem[] = result.data.list.map(
              (item) => ({
                id: item.aid,
                bvid: item.bvid,
                cid: item.cid,
                uri: item.uri,
                pic: item.pic,
                title: item.title,
                duration: item.duration,
                pubdate: item.pubdate,
                owner: item.owner,
                stat: {
                  view: item.stat.view,
                  like: item.stat.like,
                  danmaku: item.stat.danmaku,
                },
                is_followed: 0,
              })
            );

            setList((currentList) =>
              replace ? newList : [...currentList, ...newList]
            );

            watchLaterPageRef.current += 1;
            setTotal(result.data.count);
          }
        }
      } finally {
        setIsFetching(false);
      }
    },
    [apiClient, list.length]
  );

  // 收藏夹分页
  const favoritePageRef = useRef(1);
  const favoriteHasMoreRef = useRef(true);
  const currentFolderIdRef = useRef<number | null>(null);

  // 获取收藏夹列表（用于二级 Tab）
  const getFavoriteFolders = useCallback(async () => {
    const result = await apiClient.getFavoriteFolders();
    if (result.code === 0 && result.data?.list) {
      return result.data.list.map((item) => ({
        key: `fav_${item.id}`,
        label: item.title,
        id: item.id,
        media_count: item.media_count,
      }));
    }
    return [];
  }, [apiClient]);

  // 获取收藏夹详情（视频列表）
  const getFavoriteDetail = useCallback(
    async (mediaId: number, replace = false) => {
      setIsFetching(true);
      try {
        if (replace || currentFolderIdRef.current !== mediaId) {
          favoritePageRef.current = 1;
          favoriteHasMoreRef.current = true;
          currentFolderIdRef.current = mediaId;
        }

        if (!favoriteHasMoreRef.current && !replace) return;

        const result = await apiClient.getFavoriteDetail(
          mediaId,
          favoritePageRef.current,
          20
        );

        if (result.code === 0 && result.data) {
          const medias = result.data.medias || [];
          const newList: BilibiliListItem[] = medias.map((item) => ({
            id: item.id,
            bvid: item.bvid,
            cid: 0,
            uri: `https://www.bilibili.com/video/${item.bvid}`,
            pic: item.cover,
            title: item.title,
            duration: item.duration,
            pubdate: item.pubtime,
            owner: {
              mid: item.upper.mid,
              name: item.upper.name,
              face: item.upper.face,
            },
            stat: {
              view: item.cnt_info.play,
              like: 0,
              danmaku: item.cnt_info.danmaku,
            },
            is_followed: 0,
          }));

          setList((currentList) =>
            replace ? newList : [...currentList, ...newList]
          );

          favoriteHasMoreRef.current = result.data.has_more;
          favoritePageRef.current += 1;
          setTotal(
            favoriteHasMoreRef.current ? 999 : list.length + newList.length
          );
        }
      } finally {
        setIsFetching(false);
      }
    },
    [apiClient, list.length]
  );

  // 加入待看
  const addToWatchLater = useCallback(
    async (bvid: string) => {
      const result = await apiClient.addToWatchLater(bvid);
      if (result.code === 0) {
        messageApi.success("已加入待看");
      } else {
        messageApi.error(result.message || "加入待看失败");
      }
      return result;
    },
    [apiClient, messageApi]
  );

  return {
    getListData,
    isFetching,
    list,
    setList,
    total,
    setTotal,
    copyLink,
    clearList,
    messageApi,
    getFavoriteFolders,
    getFavoriteDetail,
    addToWatchLater,
  };
};

export default useBilibiliAction;
