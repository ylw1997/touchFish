/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-22 10:00:00
 * @LastEditTime: 2025-09-22 10:19:29
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\utils\request.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description: 封装 vscode postMessage 为 Promise
 */
import { vscode } from "./vscode";
import type { ZhihuCommandList } from "../../../type";
import type { MessageInstance } from "antd/es/message/interface";
import { messageHandler } from "./messageHandler"; // Import the new handler

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const request = <T = any>(
  command: ZhihuCommandList,
  payload: any,
  content: string,
  messageApi?: MessageInstance
): Promise<T> => {
  const uuid = generateUUID();
  
  if (messageApi) {
    messageApi.open({ key: uuid, type: "loading", content, duration: 0 });
  }

  vscode.postMessage({ command, payload, uuid });

  return new Promise((resolve, reject) => {
    messageHandler.addRequest(uuid, resolve, reject);
  }).then(
      (result) => {
        if (messageApi) messageApi.destroy(uuid);
        return result;
      },
      (error) => {
        if (messageApi) {
            messageApi.destroy(uuid);
            messageApi.error(error.message || "请求失败");
        }
        throw error;
      }
  ) as Promise<T>;
};
