/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 09:19:24
 * @LastEditTime: 2025-08-07 11:37:23
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\hooks\useZhihuAction.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */

import { useState, useCallback, useMemo } from "react";
import type { ZhihuItemData } from "../../../type";
import { useMessageHandler } from "./useMessageHandler";
import { useVscodeMessage } from "./useVscodeMessage";

const useZhihuAction = (
  source: string,
) => {
  const [list, setList] = useState<ZhihuItemData[]>([]);
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


  const handlers = useMemo(
    () => ({
      ZHIHU_SENDDATA: handleSendData,
    }),
    [handleSendData]
  );

  useMessageHandler(handlers);

  return {
    list,
    contextHolder,
    messageApi,
    clearList,
    getListData,
  };
};

export default useZhihuAction;
