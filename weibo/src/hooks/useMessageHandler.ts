/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-07-25 11:04:43
 * @LastEditTime: 2025-09-18 16:14:29
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\hooks\useMessageHandler.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { useEffect } from "react";

type Handlers = Record<string, (payload: any) => void>;

type Options = {
  source?: string;
  messageApi?: any;
};

export function useMessageHandler(handlers: Handlers, options?: Options) {
  useEffect(() => {
    const handler = (ev: MessageEvent<any>) => {
      if (ev.type !== "message" || !ev.data?.command) return;

      const msg: any = ev.data;
      const command = String(msg.command);
      const payload: any = msg.payload;

      // 如果 command 包含SENDIMG 直接返回
      if (command.includes("SENDIMG") || command.includes("SENDVIDEO")) {
        return;
      }

      // If options.source provided and payload contains source that doesn't match, ignore
      if (
        options?.source &&
        payload &&
        payload.source &&
        payload.source !== options.source
      ) {
        return;
      }

      // If payload contains ok and it's not success, show error via messageApi (if provided) and do not dispatch
      if (payload && typeof payload.ok !== "undefined" && payload.ok !== 1) {
        if (options?.messageApi) {
          const destroyKey = command.startsWith("SEND")
            ? `GET${command.slice(4)}`
            : command;
          options.messageApi.destroy(destroyKey);
          options.messageApi.error(payload.msg || "请求失败");
        }
        return;
      }

      // console.log("接收消息", command, options);

      const fn = handlers[command];
      fn?.(payload);
    };

    window.addEventListener("message", handler);

    return () => window.removeEventListener("message", handler);
  }, [handlers, options]);
}
