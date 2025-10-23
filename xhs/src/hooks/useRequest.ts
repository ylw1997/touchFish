/*
 * @Author: Auto-generated
 * @Description: XHS useRequest Hook 与 Weibo 版本对齐，提供统一请求入口
 */
import { useCallback } from 'react';
import { message } from 'antd';
import { messageHandler } from '../utils/messageHandler';
import type { CommandList } from '../../../type';

// 旧的 uuid 生成与手动注册逻辑移除，统一走 messageHandler.send

export const useRequest = () => {
  const [messageApi, contextHolder] = message.useMessage();

  const request = useCallback(<T = any>(command: CommandList, payload: any): Promise<T> => {
    // 直接委托给 messageHandler.send (内部管理 uuid & timeout)，避免重复 acquireVsCodeApi
    return messageHandler.send<T>(command, payload);
  }, []);

  return { request, contextHolder, messageApi };
};
