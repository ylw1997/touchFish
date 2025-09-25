/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-23 17:31:31
 * @LastEditTime: 2025-09-25 13:37:41
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\hooks\useRequest.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { message } from "antd";
import { useCallback } from "react";
import { vscode } from "../utils/vscode";
import { messageHandler } from "../utils/messageHandler";
import type { ZhihuCommandList } from "../../../type";

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useRequest = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const request = useCallback(
    <T = any>(
      command: ZhihuCommandList,
      payload: any,
      content?: string
    ): Promise<T> => {
      const uuid = generateUUID();

      vscode.postMessage({ command, payload, uuid });

      return new Promise<T>((resolve, reject) => {
        messageHandler.addRequest(uuid, resolve, reject);
      })
        .catch((error) => {
          if (content) {
            messageApi.error(error.message || "请求失败");
          }
          throw error; // Re-throw the error to be caught by the caller
        })
    },
    [messageApi]
  );

  return { request, contextHolder, messageApi };
};