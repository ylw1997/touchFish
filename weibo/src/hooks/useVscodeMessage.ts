/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-18 14:42:01
 * @LastEditTime: 2025-07-04 08:54:57
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\hooks\useVscodeMessage.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { useCallback } from "react";
import { vscode } from "../utils/vscode";
import { message } from "antd";
import { CommandList } from "../../../type";

export function useVscodeMessage() {
  const [messageApi, contextHolder] = message.useMessage();

  // 统一发送消息
  const sendMessage = useCallback(
    (
      command: CommandList,
      payload: any,
      content:string,
      source: string
    ) => {
      console.log("发送消息", command, payload,source);
      messageApi.open({
        key: command,
        type: "loading",
        content,
        duration: 0,
      });
      vscode.postMessage({ command, payload, source });
    },
    [messageApi]
  );

  return { sendMessage, contextHolder, messageApi };
}
