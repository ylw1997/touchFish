/*
 * @Author: Auto-generated
 * @Description: XHS useRequest Hook 与 Weibo 版本对齐，提供统一请求入口
 */
import { useCallback } from 'react';
import { message } from 'antd';
import { messageHandler } from '../utils/messageHandler';
import type { CommandList } from '../../../type';

// UUID 生成保持一致性
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useRequest = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const request = useCallback(<T = any>(command: CommandList, payload: any): Promise<T> => {
    const uuid = generateUUID();
    return new Promise<T>((resolve, reject) => {
      messageHandler.addRequest(uuid, resolve, reject);
      // 直接使用内部 messageHandler 的 send 逻辑，这里只负责注册然后发消息
      (window as any).acquireVsCodeApi?.().postMessage({ command, payload, uuid });
    }).catch((error) => {
      throw error;
    });
  }, []);

  return { request, contextHolder, messageApi };
};
