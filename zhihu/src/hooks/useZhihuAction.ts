/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 09:19:24
 * @LastEditTime: 2025-08-12 10:51:12
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\hooks\useZhihuAction.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */

import { useState, useCallback, useMemo } from "react";
import type { ZhihuItemData } from "../../../type";
import { useMessageHandler } from "./useMessageHandler";
import { useVscodeMessage } from "./useVscodeMessage";
import { vscode } from "../utils/vscode";

const useZhihuAction = (
  source: string,
  scrollableNodeRef: React.RefObject<HTMLDivElement | null>
) => {
  const [list, setList] = useState<ZhihuItemData[]>([]);
  const [questionDetailDrawerOpen, setQuestionDetailDrawerOpen] =
    useState(false);
  const [questionData, setQuestionData] = useState<ZhihuItemData[]>([]);
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionDetail, setQuestionDetail] = useState<string>("");
  const { sendMessage, contextHolder, messageApi } = useVscodeMessage();

  const restoreScrollPosition = useCallback(() => {
    sendMessage("ZHIHU_RESTORE_SCROLL_POSITION", undefined, "", source);
  }, [sendMessage, source]);

  const clearList = useCallback(() => {
    setList([]);
  }, []);

  const getListData = useCallback(
    (payload: any) => {
      sendMessage("ZHIHU_GETDATA", payload, "请求知乎数据中...", source);
    },
    [sendMessage, source]
  );

  const openQuestionDetailDrawer = (questionId: string, title: string) => {
    setQuestionDetailDrawerOpen(true);
    setQuestionTitle(title);
    sendMessage(
      "getZhihuQuestionDetail",
      questionId,
      "获取问题详情中...",
      "ZHIHUAPP"
    );
  };

  const closeQuestionDetailDrawer = () => {
    setQuestionDetailDrawerOpen(false);
    setQuestionData([]);
    setQuestionTitle("");
    setQuestionDetail("");
  };

  const voteHandler = (
    answerId: string,
    list: ZhihuItemData[],
    setList: React.Dispatch<React.SetStateAction<ZhihuItemData[]>>
  ) => {
    setList(
      list.map((item) => {
        if (item.id === answerId) {
          const newVoted = item.vote_next_step !== "unvote";
          const newVoteCount = newVoted
            ? (item.voteup_count ?? 0) + 1
            : (item.voteup_count ?? 0) - 1;
          vscode.postMessage({
            command: "ZHIHU_VOTE_ANSWER",
            payload: {
              answerId: item.id,
              type: newVoted ? "up" : "neutral",
            },
          });
          return {
            ...item,
            vote_next_step: newVoted ? "unvote" : "vote",
            voteup_count: newVoteCount,
          };
        }
        return item;
      })
    );
  };

  const handleVote = (answerId: string) => {
    voteHandler(answerId, list, setList);
  };

  const handleSendData = useCallback(
    (payload: any) => {
      messageApi.destroy("ZHIHU_GETDATA");
      if (payload?.data && payload.source === source) {
        // console.log(payload.data);
        setList((prev) => [...prev, ...payload.data]);
      } else if (payload?.source === source) {
        messageApi.error("数据请求失败!");
      }
    },
    [messageApi, source]
  );

  const handleSendZhihuQuestionDetail = useCallback(
    (payload: any) => {
      if (payload.detail) {
        setQuestionDetail(payload.detail);
      }
      if (payload.data) {
        setQuestionData(payload.data);
      }
      messageApi.destroy("getZhihuQuestionDetail");
    },
    [messageApi]
  );

  const handlers = useMemo(
    () => ({
      ZHIHU_SENDDATA: handleSendData,
      sendZhihuQuestionDetail: handleSendZhihuQuestionDetail,
      ZHIHU_RESTORE_SCROLL_POSITION: (payload: any) => {
        if (scrollableNodeRef.current) {
          scrollableNodeRef.current.scrollTop = payload;
        }
      },
    }),
    [handleSendData, handleSendZhihuQuestionDetail, scrollableNodeRef]
  );

  useMessageHandler(handlers);

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
    restoreScrollPosition,
    sendMessage,
    handleVote,
    voteHandler,
    questionDetail,
  };
};

export default useZhihuAction;
