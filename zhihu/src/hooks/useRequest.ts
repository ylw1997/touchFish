/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-23 17:31:31
 * @LastEditTime: 2025-09-29 16:24:31
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\hooks\useRequest.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { App } from "antd";
import { useCallback } from "react";
import { vscode } from "../utils/vscode";
import { messageHandler } from "../utils/messageHandler";
import type { ZhihuCommandList } from "../../../types/commands";
import { generateUUID } from "../../../types/utils";

export const useRequest = () => {
  const { message: messageApi } = App.useApp();

  const request = useCallback(
    <T = any>(command: ZhihuCommandList, payload: any): Promise<T> => {
      const uuid = generateUUID();

      return new Promise<T>((resolve, reject) => {
        // Register the pending request before sending the message to avoid
        // a race where the extension posts a response before the handler is added.
        messageHandler.addRequest(uuid, resolve, reject);
        vscode.postMessage({ command, payload, uuid });
      });
    },
    []
  );

  return { request, messageApi };
};
