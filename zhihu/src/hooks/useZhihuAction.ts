/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 09:19:24
 * @LastEditTime: 2025-08-07 17:37:01
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\hooks\useZhihuAction.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */

import { useState, useCallback, useMemo } from "react";
import type { ZhihuItemData } from "../../../type";
import { useMessageHandler } from "./useMessageHandler";
import { useVscodeMessage } from "./useVscodeMessage";

const useZhihuAction = (source: string) => {
  const [list, setList] = useState<ZhihuItemData[]>([]);
  const [questionDetailDrawerOpen, setQuestionDetailDrawerOpen] =
    useState(false);
  const [questionData, setQuestionData] = useState<ZhihuItemData[]>([]);
  const [questionTitle, setQuestionTitle] = useState("");
  const { sendMessage, contextHolder, messageApi } = useVscodeMessage();

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
  };

  const handleSendData = useCallback(
    (payload: any) => {
      messageApi.destroy("ZHIHU_GETDATA");
      if (payload?.data && payload.source === source) {
        console.log(payload.data);
        setList((prev) => [...prev, ...payload.data]);
      } else if (payload?.source === source) {
        messageApi.error("数据请求失败!");
      }
    },
    [messageApi, source]
  );

  const handleSendZhihuQuestionDetail = useCallback(
    (payload: any) => {
      setQuestionData(payload.data);
      messageApi.destroy("getZhihuQuestionDetail");
    },
    [messageApi]
  );

  const handlers = useMemo(
    () => ({
      ZHIHU_SENDDATA: handleSendData,
      sendZhihuQuestionDetail: handleSendZhihuQuestionDetail,
    }),
    [handleSendData, handleSendZhihuQuestionDetail]
  );

  useMessageHandler(handlers);

  return {
    list,
    contextHolder,
    clearList,
    getListData,
    questionDetailDrawerOpen,
    questionData,
    questionTitle,
    openQuestionDetailDrawer,
    closeQuestionDetailDrawer,
  };
};

export default useZhihuAction;
