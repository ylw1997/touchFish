/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-23 17:31:31
 * @LastEditTime: 2025-09-25 12:05:05
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\hooks\useRequest.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { message } from "antd";
import { useCallback } from "react";
import { CommandList } from "../../../type";
import { vscode } from "../utils/vscode";
import { messageHandler } from "../utils/messageHandler";

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
      command: CommandList,
      payload: any,
      content?: string
    ): Promise<T> => {
      const uuid = generateUUID();

      // if (content) {
      // messageApi.open({ key: uuid, type: "loading", content, duration: 0 });
      // }

      vscode.postMessage({ command, payload, uuid });

      return new Promise<T>((resolve, reject) => {
        messageHandler.addRequest(uuid, resolve, reject);
      }).catch((error) => {
        if (content) {
          messageApi.error(error.message || "请求失败");
        }
        throw error; // Re-throw the error to be caught by the caller
      });
      // .finally(() => {
      //   if (content) {
      //     // Only destroy if it was created
      //     messageApi.destroy(uuid);
      //   }
      // });
    },
    [messageApi]
  );

  return { request, contextHolder, messageApi };
};
