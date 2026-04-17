import { useCallback, useState, useMemo } from "react";
import {
  xCommentParams,
  xItem,
  xRepostParams,
  xUser,
  uploadType,
} from "../../../types/x";
import { updateXList } from "../utils/updateXList";
import { xSendParams } from "../types";
import { useRequest } from "./useRequest";
import { XApi } from "../api";

export function mergeUniqueXItems(currentList: xItem[], incomingList: xItem[]) {
  const seen = new Set<string>();
  const merged: xItem[] = [];

  for (const item of [...currentList, ...incomingList]) {
    const key = String(item.id || item.mblogid || item.bid || "");
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(item);
  }

  return merged;
}

function getSeenTweetIds(items: xItem[], limit = 20) {
  const seenIds: string[] = [];

  for (const item of items) {
    const id = item.id || item.mblogid || item.bid;
    if (!id) {
      continue;
    }
    seenIds.push(String(id));
    if (seenIds.length >= limit) {
      break;
    }
  }

  return seenIds;
}

const useXAction = () => {
  // X列表相关状态
  const [list, setList] = useState<xItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userXPage, setUserXPage] = useState(1); // 用户X页码
  const [userXCursor, setUserXCursor] = useState<string>("");
  const [maxId, setMaxId] = useState<number | string>(0);

  // 当前操作项相关状态
  const [curItem, setCurItem] = useState<xItem>();

  // 用户详情相关状态
  const [userDetailVisible, setUserDetailVisible] = useState(false);
  const [userDetail, setUserDetail] = useState<xUser>();

  // 发送状态相关
  const [sendLoading, setSendLoading] = useState(false);
  const { request, messageApi } = useRequest();

  const apiClient = useMemo(() => new XApi(request), [request]);

  // 更新X列表
  const updateList = useCallback(
    (matcher: (item: xItem) => boolean, updater: (item: xItem) => xItem) => {
      setList((list) => updateXList(list, matcher, updater));
    },
    [],
  );

  // 请求数据（主列表/用户X）
  const getListData = useCallback(
    async (payload: string, replace = false) => {
      if (isFetching) return;
      // console.log("XPLANgetListData", payload, replace);
      setIsFetching(true);
      let newPayload = payload;
      let requestPayload:
        | string
        | { group_id: string; refresh: boolean; seenTweetIds: string[] } =
        payload;
      const currentMaxId = replace ? 0 : maxId;

      if (replace) {
        setMaxId(0);
        requestPayload = {
          group_id: payload,
          refresh: true,
          seenTweetIds: getSeenTweetIds(list),
        };
      }

      if (!replace && currentMaxId !== 0 && currentMaxId !== "") {
        // If we have a max_id, use it.
        // Remove since_id if it exists.
        newPayload = newPayload.replace(/&?since_id=\d+/, "");
        // Add or replace max_id.
        if (newPayload.includes("max_id=")) {
          newPayload = newPayload.replace(
            /max_id=[^&]+/,
            `max_id=${currentMaxId}`,
          );
        } else {
          newPayload = `${newPayload}&max_id=${currentMaxId}`;
        }
      }
      try {
        if (!replace) {
          requestPayload = newPayload;
        }
        const result = await apiClient.getListData(requestPayload);
        const nextCursor = result.max_id_str || String(result.max_id || "");
        setMaxId(nextCursor || 0);
        setHasMore(!!nextCursor);
        const newList = result.statuses.filter((item) => item.mblogtype !== 1);
        setList((currentList) =>
          replace ? newList : mergeUniqueXItems(currentList, newList),
        );
        const wtotal = result.total_number ?? 9999;
        setTotal(wtotal);
        // console.log("XPLANgetListData", result, newPayload);
      } finally {
        setIsFetching(false);
      }
    },
    [apiClient, isFetching, list, maxId],
  );

  const getUserBlogData = useCallback(
    async (uid: string | number, cursor?: string) => {
      setIsFetching(true);
      try {
        const result = await apiClient.getUserBlogData(uid, cursor);
        const newList = result.statuses || [];
        setList((currentList) =>
          cursor ? [...currentList, ...newList] : newList,
        );
        setUserXCursor(result.max_id_str || "");
        const wtotal = result.total_number ?? 999;
        setTotal(wtotal);
      } finally {
        setIsFetching(false);
      }
    },
    [apiClient],
  );

  // 清空列表
  const clearList = useCallback(() => {
    setList([]);
    setHasMore(true);
    setMaxId(0);
    setUserXCursor("");
  }, [setUserXCursor]);

  // 复制
  const copyLink = useCallback(
    (url: string) => {
      navigator.clipboard.writeText(url).then(() => {
        messageApi.success("链接已复制到剪贴板");
      });
    },
    [messageApi],
  );

  // 合并评论展开/收起方法
  const handleToggleComments = useCallback(
    async (
      id: number | string,
      uid: number | string,
      is_retweeted: boolean,
    ) => {
      const citem = list.find(
        (item) => item.id === id || item.retweeted_status?.id === id,
      );
      if (citem?.comments && !is_retweeted) {
        updateList(
          (item) => item.id === id,
          (item) => ({ ...item, comments: undefined }),
        );
        return;
      }
      if (is_retweeted && citem?.retweeted_status?.comments) {
        updateList(
          (item) => item.retweeted_status?.id === id,
          (item) => ({
            ...item,
            retweeted_status: {
              ...item.retweeted_status!,
              comments: undefined,
            },
          }),
        );
        return;
      }
      // Set loading state
      if (is_retweeted) {
        updateList(
          (item) => item.retweeted_status?.id === id,
          (item) => ({
            ...item,
            retweeted_status: {
              ...item.retweeted_status!,
              comments: "loading", // Special value for loading
            },
          }),
        );
      } else {
        updateList(
          (item) => item.id === id,
          (item) => ({ ...item, comments: "loading" }), // Special value for loading
        );
      }
      const result = await apiClient.getComments(id, uid);
      if (is_retweeted) {
        updateList(
          (item) => item.retweeted_status?.id === id,
          (item) => ({
            ...item,
            retweeted_status: {
              ...item.retweeted_status!,
              comments: result.data,
            },
          }),
        );
      } else {
        updateList(
          (item) => item.id === id,
          (item) => ({ ...item, comments: result.data }),
        );
      }
    },
    [list, updateList, apiClient],
  );

  // 合并长X展开方法
  const handleExpandLongX = useCallback(
    async (id: string | number) => {
      updateList(
        (item) => (item.mblogid ? item.mblogid : item.bid) === id.toString(),
        (item) => ({
          ...item,
          text_raw: item.longTextContent || item.text_raw,
          text: item.longTextContent || item.text,
        }),
      );
    },
    [updateList],
  );

  // 查看博主X
  const getUserBlog = useCallback(
    async (userInfo: xUser) => {
      if (!userInfo) return;
      // 使用 screen_name_raw 而不是 id
      const screenName = userInfo.screen_name_raw || userInfo.screen_name;
      const result = await apiClient.getUserByName(screenName);
      setUserDetail(result.data);
      setUserDetailVisible(true);
    },
    [apiClient],
  );

  const getUserByName = useCallback(
    async (username: string) => {
      const result = await apiClient.getUserByName(username);
      setUserDetail(result.data);
      setUserDetailVisible(true);
    },
    [apiClient],
  );

  const getMyUserInfo = useCallback(async () => {
    try {
      const result = await apiClient.getMyUserInfo();
      if (result && result.data) {
        setUserDetail({
          ...result.data,
          avatar_hd: result.data.avatar,
        });
        setUserDetailVisible(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, [apiClient]);

  // 关注博主
  const followUser = useCallback(
    async (userInfo?: xUser) => {
      if (!userInfo) return;
      await apiClient.followUser(userInfo.id);
      messageApi.success("关注成功!");
      setUserDetail((prev) => (prev ? { ...prev, following: true } : prev));
      updateList(
        (item) => item.user?.id === userInfo!.id,
        (item) => ({
          ...item,
          user: { ...item.user, following: true } as xUser,
        }),
      );
    },
    [updateList, apiClient, messageApi],
  );

  // 取关博主
  const cancelFollow = useCallback(
    async (userInfo?: xUser) => {
      if (!userInfo) return;
      await apiClient.cancelFollow(userInfo.id);
      messageApi.success("取消关注成功!");
      setUserDetail((prev) => (prev ? { ...prev, following: false } : prev));
      updateList(
        (item) => item.user?.id === userInfo!.id,
        (item) => ({
          ...item,
          user: { ...item.user, following: false } as xUser,
        }),
      );
    },
    [updateList, apiClient, messageApi],
  );

  // 搜索
  const getHotSearch = useCallback(async () => {
    const result = await apiClient.getHotSearch();
    return (result.data.realtime || []).slice(0, 20);
  }, [apiClient]);

  const getXSearch = useCallback(
    async (payload: { query: string; cursor?: string; product?: string }) => {
      setIsFetching(true);
      try {
        const result = await apiClient.getXSearch(payload);
        return result;
      } finally {
        setIsFetching(false);
      }
    },
    [apiClient],
  );

  const uploadImage = useCallback(
    async (uploadData: uploadType) => {
      const result = await apiClient.uploadImage(uploadData);
      return result;
    },
    [apiClient],
  );

  // 发送X功能
  const handleSendX = useCallback(
    async (content: xSendParams) => {
      setSendLoading(true);
      try {
        await apiClient.sendX(content);
        messageApi.success("X发送成功!");
        // setList((prev) => [result.data, ...prev]);
      } finally {
        setSendLoading(false);
      }
    },
    [apiClient, messageApi],
  );

  // handleCommentOrRepost 评论或转发
  const handleCommentOrRepost = useCallback(
    async (comment: string, item: xItem, type: "comment" | "repost") => {
      if (type === "comment") {
        const obj = {
          comment,
          id: item.id,
          pic_id: "",
          is_repost: 0,
          comment_ori: 0,
          is_comment: 0,
        } as xCommentParams;
        await apiClient.createComment(obj);
        messageApi.success("评论成功!");
        updateList(
          (i) => i.id === item.id,
          (i) => ({ ...i, comments_count: i.comments_count + 1 }),
        );
        // 刷新评论
        const result = await apiClient.getMoreComments(item.id, item.user?.id);
        updateList(
          (i) => i.id === item.id,
          (i) => ({ ...i, comments: result.data }),
        );
      }

      if (type === "repost") {
        const obj = {
          comment,
          id: item.id,
          pic_id: "",
          is_repost: 0,
          comment_ori: 0,
          is_comment: 0,
          visible: 0,
          share_id: "",
          screen_name: item.user?.screen_name_raw,
        } as xRepostParams;
        await apiClient.createRepost(obj);
        messageApi.success("转发成功!");
      }
    },
    [updateList, apiClient, messageApi],
  );

  // 点赞,取消点赞
  const handleLike = useCallback(
    async (item: xItem, type: "like" | "cancel") => {
      setCurItem(item);
      if (type === "like") {
        await apiClient.setLike(item.id);
        messageApi.success("点赞成功!");
        updateList(
          (i) => i.id === item.id,
          (i) => ({
            ...i,
            attitudes_status: 1,
            attitudes_count: i.attitudes_count + 1,
          }),
        );
      }
      if (type === "cancel") {
        await apiClient.cancelLike(item.id);
        messageApi.success("取消点赞成功!");
        updateList(
          (i) => i.id === item.id,
          (i) => ({
            ...i,
            attitudes_status: 0,
            attitudes_count: i.attitudes_count - 1,
          }),
        );
      }
    },
    [updateList, apiClient, messageApi],
  );

  // 翻译博客
  const handleTranslate = useCallback(
    async (item: any) => {
      updateList(
        (i) => i.id === item.id,
        (i) => ({ ...i, isTranslating: true }),
      );
      try {
        const res = await apiClient.translateTweet(item.id);
        if (res.ok === 1 && res.data) {
          updateList(
            (i) => i.id === item.id,
            (i) => ({ ...i, translatedText: res.data, isTranslating: false }),
          );
        } else {
          messageApi.error(res.msg || "翻译失败");
          updateList(
            (i) => i.id === item.id,
            (i) => ({ ...i, isTranslating: false }),
          );
        }
      } catch (err) {
        console.error(err);
        updateList(
          (i) => i.id === item.id,
          (i) => ({ ...i, isTranslating: false }),
        );
      }
    },
    [apiClient, updateList, messageApi],
  );

  // 清除翻译
  const handleClearTranslation = useCallback(
    (item: xItem) => {
      updateList(
        (i) => i.id === item.id,
        (i) => ({ ...i, translatedText: undefined }),
      );
    },
    [updateList],
  );

  return {
    getListData,
    getUserBlogData,
    isFetching,
    list,
    setList,
    total,
    setTotal,
    hasMore,
    setHasMore,
    updateList,
    copyLink,
    clearList,
    handleToggleComments,
    handleExpandLongX,
    curItem,
    setCurItem,
    userDetailVisible,
    setUserDetailVisible,
    userDetail,
    setUserDetail,
    getUserBlog,
    sendLoading,
    setSendLoading,
    handleCommentOrRepost,
    handleLike,
    handleSendX,
    cancelFollow,
    followUser,
    handleTranslate,
    handleClearTranslation,
    userXPage,
    setUserXPage,
    userXCursor,
    setUserXCursor,
    getUserByName,
    getMyUserInfo,
    getHotSearch,
    getXSearch,
    uploadImage,
    messageApi,
  };
};

export default useXAction;
