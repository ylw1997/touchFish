import { useState, useCallback, useMemo } from "react";
import type { ZhihuItemData } from "../../../type";
import { useRequest } from "./useRequest";
import { ZhihuApi } from "../api";

const useZhihuAction = () => {
  const [list, setList] = useState<ZhihuItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [questionDetailDrawerOpen, setQuestionDetailDrawerOpen] =
    useState(false);
  const [questionData, setQuestionData] = useState<ZhihuItemData[]>([]);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionDetail, setQuestionDetail] = useState<string>("");
  const [isFollowing, setIsFollowing] = useState<boolean>();
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("");
  const { request, contextHolder, messageApi } = useRequest();

  const apiClient = useMemo(() => new ZhihuApi(request), [request]);

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
        const result = await apiClient.getZhihuList(payload);
        if (result) {
          setList((currentList) =>
            replace ? result : [...currentList, ...result]
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [apiClient, loading]
  );

  const openQuestionDetailDrawer = async (
    questionId: string,
    title: string
  ) => {
    setQuestionDetailDrawerOpen(true);
    setQuestionTitle(title);
    setCurrentQuestionId(questionId);
    const result = await apiClient.getQuestionDetail(questionId);
    if (result.detail) {
      setQuestionDetail(result.detail);
    }
    if (result.data) {
      setQuestionData(result.data);
    }
    if (result.isFollowing !== undefined) {
      setIsFollowing(result.isFollowing);
    }
  };

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
    loading,
  };
};

export default useZhihuAction;
