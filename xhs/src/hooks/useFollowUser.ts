/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-11-06
 * @Description: 通用关注/取关用户 Hook
 */
import { useState, useCallback, useRef } from "react";
import { createXhsApi } from "../api";
import { useRequest } from "./useRequest";

interface UseFollowUserOptions {
  /** 初始关注状态 */
  initialFollowing?: boolean;
  /** 成功回调 */
  onSuccess?: (isFollowing: boolean) => void;
  /** 失败回调 */
  onError?: (error: any, isFollowing: boolean) => void;
}

/**
 * 关注/取关用户 Hook
 * 统一处理关注状态管理和 API 调用
 */
export function useFollowUser(options: UseFollowUserOptions = {}) {
  const { initialFollowing = false, onSuccess, onError } = options;
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const { request, messageApi } = useRequest();
  const apiRef = useRef(createXhsApi(request));

  /**
   * 切换关注状态
   * @param userId 目标用户ID
   */
  const toggleFollow = useCallback(
    async (userId: string) => {
      if (!userId || loading) return;

      setLoading(true);
      const wasFollowing = isFollowing;

      try {
        // 乐观更新
        setIsFollowing(!wasFollowing);

        if (wasFollowing) {
          await apiRef.current.unfollowUser({ target_user_id: userId });
          messageApi.success("已取消关注");
        } else {
          await apiRef.current.followUser({ target_user_id: userId });
          messageApi.success("关注成功");
        }

        onSuccess?.(!wasFollowing);
      } catch (e: any) {
        // 回滚状态
        setIsFollowing(wasFollowing);
        const errorMsg = e?.message || (wasFollowing ? "取消关注失败" : "关注失败");
        messageApi.error(errorMsg);
        onError?.(e, wasFollowing);
      } finally {
        setLoading(false);
      }
    },
    [isFollowing, loading, messageApi, onSuccess, onError]
  );

  /**
   * 直接设置关注状态（用于外部同步）
   */
  const setFollowing = useCallback((following: boolean) => {
    setIsFollowing(following);
  }, []);

  return {
    isFollowing,
    loading,
    toggleFollow,
    setFollowing,
  };
}

export default useFollowUser;
