/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-07-25 11:04:43
 * @LastEditTime: 2025-07-25 11:05:39
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\hooks\useMessageHandler.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
import { useEffect } from "react";
import { commandsType, weiboAJAX } from "../../../type";

type Handlers = Record<string, (payload: any) => void>;

export function useMessageHandler(handlers: Handlers) {
  useEffect(() => {
    const handler = (ev: MessageEvent<commandsType<weiboAJAX>>) => {
      if (ev.type !== "message" || !ev.data.command) return;
      
      const msg = ev.data;
      const command = msg.command as string;
      const fn = handlers[command];
      fn?.(msg.payload);
    };

    window.addEventListener("message", handler);

    return () => window.removeEventListener("message", handler);
  }, [handlers]);
}
