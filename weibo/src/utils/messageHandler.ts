/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-22 11:50:57
 * @LastEditTime: 2025-09-22 12:00:25
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\utils\messageHandler.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeoutId: NodeJS.Timeout;
};

class MessageHandler {
  private pendingRequests = new Map<string, PendingRequest>();
  private static instance: MessageHandler;

  private constructor() {
    window.addEventListener("message", this.handleMessage.bind(this));
  }

  public static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }
    return MessageHandler.instance;
  }

  private handleMessage(event: MessageEvent) {
    const response = event.data;
    if (response.uuid && this.pendingRequests.has(response.uuid)) {
      const pendingRequest = this.pendingRequests.get(response.uuid)!;
      clearTimeout(pendingRequest.timeoutId);

      if (
        response.payload &&
        typeof response.payload.ok !== "undefined" &&
        response.payload.ok !== 1
      ) {
        pendingRequest.reject(new Error(response.payload.msg || "请求失败"));
      } else {
        pendingRequest.resolve(response.payload);
      }
      this.pendingRequests.delete(response.uuid);
    }
  }

  public addRequest(
    uuid: string,
    resolve: (value: any) => void,
    reject: (reason?: any) => void,
    timeout: number = 10000
  ) {
    const timeoutId = setTimeout(() => {
      this.pendingRequests.delete(uuid);
      reject(new Error("Request timed out"));
    }, timeout);

    this.pendingRequests.set(uuid, { resolve, reject, timeoutId });
    // console.log("addRequest", uuid, this.pendingRequests);
  }
}

export const messageHandler = MessageHandler.getInstance();
