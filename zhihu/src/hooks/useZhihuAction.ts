import { useState, useCallback, useMemo } from "react";
import type { ZhihuItemData } from "../../../type";
import { useRequest } from "./useRequest";
import { ZhihuApi } from "../api";

const useZhihuAction = () => {
  const [list, setList] = useState<ZhihuItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagingMap, setPagingMap] = useState<Record<string, any>>({});
  const [questionPagingMap, setQuestionPagingMap] = useState<Record<string, any>>({});
  const [questionDetailDrawerOpen, setQuestionDetailDrawerOpen] =
    useState(false);
  const [questionData, setQuestionData] = useState<ZhihuItemData[]>([]);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionDetail, setQuestionDetail] = useState<string>("");
  const [isFollowing, setIsFollowing] = useState<boolean>();
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("");
  const { request, contextHolder, messageApi } = useRequest();

  const apiClient = useMemo(() => new ZhihuApi(request), [request]);

  // 复制链接到剪贴板
  const copyLink = useCallback(
    (url: string, title?: string) => {
      const textToCopy = title ? `${title}\n${url}` : url;
      navigator.clipboard.writeText(textToCopy).then(() => {
        messageApi.success("链接已复制到剪贴板");
      }).catch(() => {
        messageApi.error("复制失败，请手动复制链接");
      });
    },
    [messageApi]
  );

  const clearList = useCallback(() => {
    setList([]);
  }, []);

  const getListData = useCallback(
    async (payload: any, replace = false) => {
      if (loading) {
        return;
      }
      setLoading(true);
      try {
        // payload can be tab string or { tab, nextUrl }
        const tab = typeof payload === "string" ? payload : payload.tab;
        const nextUrl = typeof payload === "string" ? undefined : payload.nextUrl;
        const result = await apiClient.getZhihuList({ tab, nextUrl });
        console.log("getListData result", result);
        // result expected to be { data: ZhihuItemData[], paging?: { next?: string, is_end?: boolean } }
        if (result && result.data) {
          setList((currentList) => (replace ? result.data : [...currentList, ...result.data]));
          setPagingMap((m) => ({ ...m, [tab]: result.paging }));
        }
      } finally {
        setLoading(false);
      }
    },
    [apiClient, loading]
  );

  const fetchNext = useCallback(
    async (tab: string) => {
      const paging = pagingMap[tab];
      if (paging && paging.is_end) return;
      const nextUrl = paging?.next;
      await getListData({ tab, nextUrl }, false);
    },
    [getListData, pagingMap]
  );

  const hasMore = useCallback((tab: string) => {
    const paging = pagingMap[tab];
    // Only consider hasMore true when paging exists and is_end is false
    if (!paging) return false;
    return paging.is_end !== true;
  }, [pagingMap]);

  const hasMoreQuestion = useCallback((questionId: string) => {
    const paging = questionPagingMap[questionId];
    if (!paging) return false;
    return paging.is_end !== true;
  }, [questionPagingMap]);

  const openQuestionDetailDrawer = async (
    questionId: string,
    title: string
  ) => {
    setQuestionDetailDrawerOpen(true);
    setQuestionTitle(title);
    setCurrentQuestionId(questionId);
    // initialize temporary paging so UI treats as having more until real paging arrives
    setQuestionPagingMap((m) => ({ ...m, [questionId]: { is_end: false } }));
    const result = await apiClient.getQuestionDetail({ questionId });
    if (result.detail) {
      setQuestionDetail(result.detail);
    }
    if (result.data) {
      setQuestionData(result.data);
    }
    if (result.paging) {
      setQuestionPagingMap((m) => ({ ...m, [questionId]: result.paging }));
    }
    if (result.isFollowing !== undefined) {
      setIsFollowing(result.isFollowing);
    }
  };

  const fetchQuestionNext = useCallback(
    async (questionId: string) => {
      console.log("fetchQuestionNext", questionId,pagingMap);
      const paging = questionPagingMap[questionId];
      if (paging && paging.is_end) return;
      const nextUrl = paging?.next;
      if (!nextUrl) return;
      const res = await apiClient.getQuestionDetail({ questionId, nextUrl });
      if (res && res.data) {
        setQuestionData((cur) => [...cur, ...res.data]);
        if (res.paging) {
          setQuestionPagingMap((m) => ({ ...m, [questionId]: res.paging }));
        }
      }
    },
    [apiClient, pagingMap, questionPagingMap]
  );

  const closeQuestionDetailDrawer = () => {
    setQuestionDetailDrawerOpen(false);
    setQuestionData([]);
    setQuestionTitle("");
    setQuestionDetail("");
    setCurrentQuestionId("");
  };

  const voteHandler = async (
    answerId: string,
    type: "up" | "neutral",
    listToUpdate: ZhihuItemData[],
    setListToUpdate: React.Dispatch<React.SetStateAction<ZhihuItemData[]>>
  ) => {
    await apiClient.voteAnswer(answerId, type);
    setListToUpdate(
      listToUpdate.map((item) => {
        if (item.id === answerId) {
          const newVoted = type === "up";
          const newVoteCount = newVoted
            ? (item.voteup_count ?? 0) + 1
            : (item.voteup_count ?? 0) - 1;
          return {
            ...item,
            vote_next_step: newVoted ? "unvote" : "vote",
            voteup_count: newVoteCount,
          };
        }
        return item;
      })
    );
    messageApi.success("操作成功!");
  };

  const handleVote = (answerId: string, type: "up" | "neutral") => {
    voteHandler(answerId, type, list, setList);
  };

  const handleQuestionVote = (answerId: string, type: "up" | "neutral") => {
    voteHandler(answerId, type, questionData, setQuestionData);
  };

  const followHandler = async () => {
    if (currentQuestionId) {
      await apiClient.followQuestion(currentQuestionId);
      setIsFollowing(true);
      messageApi.success("关注成功!");
    }
  };

  const unfollowHandler = async () => {
    if (currentQuestionId) {
      await apiClient.unfollowQuestion(currentQuestionId);
      setIsFollowing(false);
      messageApi.success("取消关注成功!");
    }
  };

  const searchZhihu = useCallback(
    async (keyword: string) => {
      const results = await apiClient.searchZhihu(keyword);
      return results;
    },
    [apiClient]
  );

  const getZhihuComment = useCallback(
    async (answerId: string) => {
      const result = await apiClient.getZhihuComment(answerId);
      return result.data;
    },
    [apiClient]
  );

  return {
    list,
    contextHolder,
    clearList,
    getListData,
    fetchNext,
    hasMore,
    fetchQuestionNext,
  currentQuestionId,
  hasMoreQuestion,
    questionDetailDrawerOpen,
    questionData,
    setQuestionData,
    questionTitle,
    openQuestionDetailDrawer,
    closeQuestionDetailDrawer,
    handleVote,
    handleQuestionVote,
    questionDetail,
    isFollowing,
    followHandler,
    unfollowHandler,
    searchZhihu,
    getZhihuComment,
    copyLink,
    loading,
    messageApi,
  };
};

export default useZhihuAction;
