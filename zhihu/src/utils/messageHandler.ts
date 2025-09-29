/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-25 10:58:35
 * @LastEditTime: 2025-09-29 16:24:38
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\utils\messageHandler.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
type PendingRequest = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeoutId: NodeJS.Timeout;
};

type UnsolicitedMessageHandler = (command: string, payload: any) => void;

class MessageHandler {
  private pendingRequests = new Map<string, PendingRequest>();
  private unsolicitedListeners: UnsolicitedMessageHandler[] = [];
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
    if (!response) return;

    // Case 1: It's a response to a pending request
    if (response.uuid && this.pendingRequests.has(response.uuid)) {
      // console.log("handleMessage", response);
      const pendingRequest = this.pendingRequests.get(response.uuid)!;
      clearTimeout(pendingRequest.timeoutId);

      if (
        response.payload &&
        typeof response.payload.ok !== "undefined" &&
        response.payload.ok !== 1
      ) {
        console.log("handleMessage", new Error(response.payload.msg || "请求失败"));
        pendingRequest.reject(new Error(response.payload.msg || "请求失败"));
      } else {
        pendingRequest.resolve(response.payload);
      }
      this.pendingRequests.delete(response.uuid);
      return;
    }

    // Case 2: It's an unsolicited message
    if (response.command) {
      this.unsolicitedListeners.forEach((listener) => {
        listener(response.command, response.payload);
      });
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

  public addUnsolicitedListener(handler: UnsolicitedMessageHandler) {
    this.unsolicitedListeners.push(handler);
    return () => {
      // Return a function to remove the listener
      const index = this.unsolicitedListeners.indexOf(handler);
      if (index > -1) {
        this.unsolicitedListeners.splice(index, 1);
      }
    };
  }
}

export const messageHandler = MessageHandler.getInstance();
