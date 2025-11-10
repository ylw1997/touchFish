/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-23 17:31:31
 * @LastEditTime: 2025-09-25 16:50:32
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\hooks\useRequest.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { App } from "antd";
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
  const { message: messageApi } = App.useApp();

  const request = useCallback(
    <T = any>(command: CommandList, payload: any): Promise<T> => {
      const uuid = generateUUID();

      return new Promise<T>((resolve, reject) => {
        // Register the pending request before sending the message to avoid
        // a race where the extension posts a response before the handler is added.
        messageHandler.addRequest(uuid, resolve, reject);
        vscode.postMessage({ command, payload, uuid });
      }).catch((error) => {
        throw error; // Re-throw the error to be caught by the caller
      });
    },
    []
  );

  return { request, messageApi };
};
