import { useEffect, useRef, useCallback } from 'react';
import type { BilibiliApi } from '../api';
import type Artplayer from 'artplayer';

export interface UseBilibiliHeartbeatParams {
  apiClient: BilibiliApi;
  artRef: React.RefObject<Artplayer | null>;
  videoInfo: { aid: number; bvid: string; cid: number; duration: number } | null | undefined;
  isPlaying: boolean;
}

export function useBilibiliHeartbeat({
  apiClient,
  artRef,
  videoInfo,
  isPlaying,
}: UseBilibiliHeartbeatParams) {
  const lastReportedStateRef = useRef<boolean | null>(null);
  const isEndedRef = useRef<boolean>(false);
  const ignorePauseRef = useRef<boolean>(false);

  const setIgnorePause = useCallback((ignore: boolean) => {
    ignorePauseRef.current = ignore;
  }, []);

  const resetState = useCallback(() => {
    lastReportedStateRef.current = null;
    isEndedRef.current = false;
    ignorePauseRef.current = false;
  }, []);

  const reportHeartbeat = useCallback(
    (playType: number, playedTime?: number) => {
      if (!videoInfo || videoInfo.duration === 0) return;
      const time =
        playedTime !== undefined
          ? playedTime
          : artRef.current
            ? Math.floor(artRef.current.currentTime)
            : 0;

      apiClient
        .reportHeartbeat({
          aid: videoInfo.aid,
          bvid: videoInfo.bvid,
          cid: videoInfo.cid || 0,
          played_time: time,
          play_type: playType,
        })
        .catch((err) => {
          console.error(
            `[useBilibiliHeartbeat] 上报异常 (play_type: ${playType}):`,
            err
          );
        });
    },
    [apiClient, artRef, videoInfo]
  );

  const reportPlay = useCallback(() => {
    setTimeout(() => {
      ignorePauseRef.current = false;
    }, 300);

    isEndedRef.current = false;
    if (lastReportedStateRef.current === true) return false;
    lastReportedStateRef.current = true;

    setTimeout(() => {
      reportHeartbeat(1);
    }, 50);

    return true;
  }, [reportHeartbeat]);

  const reportPause = useCallback(() => {
    if (isEndedRef.current || ignorePauseRef.current) return false;
    if (lastReportedStateRef.current === false) return false;
    lastReportedStateRef.current = false;

    reportHeartbeat(2);
    return true;
  }, [reportHeartbeat]);

  const reportEnded = useCallback(() => {
    if (!videoInfo || videoInfo.duration === 0) return;
    isEndedRef.current = true;
    console.log(
      `[useBilibiliHeartbeat] 完播上报 (aid: ${videoInfo.aid}, bvid: ${videoInfo.bvid})`
    );
    reportHeartbeat(4, -1);
  }, [reportHeartbeat, videoInfo]);

  const reportClose = useCallback(() => {
    if (!videoInfo || videoInfo.duration === 0) return;
    if (!isEndedRef.current) {
      reportHeartbeat(2);
    }
    resetState();
  }, [reportHeartbeat, videoInfo, resetState]);

  // 定时循环心跳
  useEffect(() => {
    let intervalId: any = null;

    if (isPlaying && videoInfo && videoInfo.duration > 0) {
      intervalId = setInterval(() => {
        // 如果已经播放完毕，不再发送循环心跳，防止完播标志（-1）被覆盖
        if (isEndedRef.current) return;
        // 如果当前真实状态是暂停，也不再发送循环心跳（兼容 VideoCard 中 isPlaying 仅代表挂载状态的情况）
        if (lastReportedStateRef.current === false) return;

        reportHeartbeat(3);
      }, 15000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, videoInfo, reportHeartbeat]);

  return {
    reportPlay,
    reportPause,
    reportEnded,
    reportClose,
    setIgnorePause,
    resetState,
  };
}
