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

  const { request, messageApi } = useRequest();
  const apiClient = useMemo(() => new BilibiliApi(request), [request]);

  // 清空列表
  const clearList = useCallback(() => {
    setList([]);
    dynamicPageRef.current = 1;
    dynamicOffsetRef.current = undefined;
    hasMoreRef.current = true;
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
        }
        // TODO: 待看、收藏夹接口
      } finally {
        setIsFetching(false);
      }
    },
    [apiClient, list.length]
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
  };
};

export default useBilibiliAction;
