/*
 * @Description: Bilibili 业务逻辑 Hook
 */
import { useCallback, useState, useMemo } from "react";
import type { BilibiliListItem } from "../types/bilibili";
import { useRequest } from "./useRequest";
import { BilibiliApi } from "../api";

const useBilibiliAction = () => {
  // 视频列表相关状态
  const [list, setList] = useState<BilibiliListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const { request, messageApi } = useRequest();
  const apiClient = useMemo(() => new BilibiliApi(request), [request]);

  // 清空列表
  const clearList = useCallback(() => {
    setList([]);
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

  // 获取推荐列表数据
  const getListData = useCallback(
    async (payload: string, replace = false) => {
      setIsFetching(true);
      try {
        // 根据 payload 判断请求类型，目前只实现推荐
        if (payload === "recommend") {
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
            // 推荐接口没有 total，设置一个较大的值
            setTotal(999);
          }
        }
        // TODO: 动态、待看、收藏夹接口
      } finally {
        setIsFetching(false);
      }
    },
    [apiClient]
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
