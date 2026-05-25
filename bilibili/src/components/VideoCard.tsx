/*
 * @Description: B站视频卡片组件
 */
import React, { useState, useRef } from "react";
import {
  PlayCircleOutlined,
  PlayCircleFilled,
  MessageOutlined,
  ClockCircleOutlined,
  PlusCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { App } from "antd";
import type {
  BilibiliListItem,
  BilibiliPlayUrlResponse,
  BilibiliDanmakuResponse,
} from "../types/bilibili";
import { usePlayerStore } from "../store/player";
import dayjs from "dayjs";
import ArtPlayerComponent from "./ArtPlayerComponent";
import { useRequest } from "../hooks/useRequest";
import { BilibiliApi } from "../api";
import Artplayer from "artplayer";

export interface VideoCardProps {
  item: BilibiliListItem;
  onCopyLink?: (url: string) => void;
  onAddToWatchLater?: (bvid: string) => void;
  onDeleteFromWatchLater?: (avid: string) => void;
  onGetPlayUrl?: (
    bvid: string,
    cid: number,
  ) => Promise<BilibiliPlayUrlResponse>;
  onGetLivePlayUrl?: (roomId: number) => Promise<BilibiliPlayUrlResponse>;
  onGetDanmaku?: (cid: number) => Promise<BilibiliDanmakuResponse>;
  onError?: (message: string) => void;
  onUserClick?: (owner: BilibiliListItem["owner"]) => void;
}

// 格式化播放量
const formatCount = (count: number | undefined | null): string => {
  if (!count) return "0";
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + "万";
  }
  return count.toString();
};

// 格式化时长
const formatDuration = (seconds: number): string => {
  if (seconds === 0) return "LIVE";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const VideoCard: React.FC<VideoCardProps> = ({
  item,
  onAddToWatchLater,
  onDeleteFromWatchLater,
  onGetPlayUrl,
  onGetLivePlayUrl,
  onGetDanmaku,
  onUserClick,
}) => {
  const { message } = App.useApp();
  const { addToPlaylist } = usePlayerStore();
  const isMainPlaying = usePlayerStore((state) => state.isPlaying);
  const { request } = useRequest();
  const apiClient = React.useMemo(() => new BilibiliApi(request), [request]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [danmakuData, setDanmakuData] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPagesExpanded, setIsPagesExpanded] = useState(false);
  const [selectedCid, setSelectedCid] = useState<number>(item.cid || 0);
  const artRef = useRef<Artplayer | null>(null);
  const lastReportedStateRef = useRef<boolean | null>(null); // 防抖/状态去重

  React.useEffect(() => {
    setSelectedCid(item.cid || 0);
  }, [item.cid]);

  // 互斥互锁机制：当全局主播放器开始播放时，自动关闭当前卡片的局部播放
  React.useEffect(() => {
    if (isMainPlaying && isPlaying && artRef.current) {
      console.log(`%c[VideoCard] 主播放器已启动，自动关闭卡片[${item.bvid}]的局部播放器防止音轨冲突`, 'color: #ff9800; font-weight: bold;');
      
      const playedTime = Math.floor(artRef.current.currentTime);
      if (item.duration !== 0) {
        apiClient.reportHeartbeat({
          aid: item.id,
          bvid: item.bvid,
          cid: selectedCid || item.cid || 0,
          played_time: playedTime,
          play_type: 2,
        }).catch(() => {});
      }
      
      artRef.current.destroy(true);
      artRef.current = null;
      setIsPlaying(false);
      setVideoUrl(null);
      setDanmakuData("");
      lastReportedStateRef.current = null;
    }
  }, [isMainPlaying, isPlaying, item, selectedCid, apiClient]);

  const handleOpenVideo = () => {
    // 在VSCode扩展中不能打开网页，仅用于阻止事件
  };

  const handlePlayClick = async (e: React.MouseEvent, targetCid?: number) => {
    e.stopPropagation();

    // 直播：获取直播流地址并播放
    if (item.duration === 0 && onGetLivePlayUrl) {
      setIsLoading(true);
      try {
        const result = await onGetLivePlayUrl(item.id);
        if (result.code === 0 && result.data?.durl?.[0]?.url) {
          setVideoUrl(result.data.durl[0].url);
          setIsPlaying(true);
        } else {
          message.error("获取直播流失败");
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!onGetPlayUrl) {
      return;
    }

    const playCid = targetCid || selectedCid;
    if (targetCid) {
      setSelectedCid(targetCid);
    }

    setIsLoading(true);
    try {
      const result = await onGetPlayUrl(item.bvid, playCid);
      if (result.code === 0 && result.data?.durl?.[0]?.url) {
        setVideoUrl(result.data.durl[0].url);

        // 获取弹幕
        const danmakuCid = result.data?.cid || playCid;
        if (onGetDanmaku && danmakuCid) {
          try {
            const danmakuRes = await onGetDanmaku(danmakuCid);
            if (danmakuRes.code === 0 && danmakuRes.data) {
              setDanmakuData(danmakuRes.data);
            }
          } catch (e) {
            console.error("获取弹幕失败", e);
          }
        }

        setIsPlaying(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleArtInstance = (art: Artplayer) => {
    artRef.current = art;
  };

  const handleArtPlay = () => {
    if (lastReportedStateRef.current === true) return;
    lastReportedStateRef.current = true;

    if (item.duration !== 0 && artRef.current) {
      const playedTime = Math.floor(artRef.current.currentTime);
      apiClient
        .reportHeartbeat({
          aid: item.id,
          bvid: item.bvid,
          cid: selectedCid || item.cid || 0,
          played_time: playedTime,
          play_type: 1, // 播放中上报
        })
        .then(() => {})
        .catch((err) => console.error("[VideoCard] 局部播放上报异常:", err));
    }
  };

  const handleArtPause = () => {
    if (lastReportedStateRef.current === false) return;
    lastReportedStateRef.current = false;

    if (item.duration !== 0 && artRef.current) {
      const playedTime = Math.floor(artRef.current.currentTime);
      apiClient
        .reportHeartbeat({
          aid: item.id,
          bvid: item.bvid,
          cid: selectedCid || item.cid || 0,
          played_time: playedTime,
          play_type: 2, // 暂停上报
        })
        .then(() => {})
        .catch((err) => console.error("[VideoCard] 局部暂停上报异常:", err));
    }
  };

  const handleCloseVideo = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (item.duration !== 0 && artRef.current) {
      const playedTime = Math.floor(artRef.current.currentTime);
      apiClient
        .reportHeartbeat({
          aid: item.id,
          bvid: item.bvid,
          cid: selectedCid || item.cid || 0,
          played_time: playedTime,
          play_type: 2, // 暂停形式保存
        })
        .then(() => {})
        .catch((err) =>
          console.error("[VideoCard] 局部播放关闭上报异常:", err),
        );
    }

    if (artRef.current) {
      artRef.current.destroy(true);
      artRef.current = null;
    }
    setIsPlaying(false);
    setVideoUrl(null);
    setDanmakuData("");
    lastReportedStateRef.current = null;
  };

  const handleAddToWatchLater = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.duration !== 0 && onAddToWatchLater && item.bvid) {
      onAddToWatchLater(item.bvid);
    }
  };

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 如果当前卡片有局部播放器正在播放，先停止并上报进度，防止两个音轨同时播放
    if (isPlaying && artRef.current) {
      const playedTime = Math.floor(artRef.current.currentTime);
      if (item.duration > 0) {
        apiClient.reportHeartbeat({
          aid: item.id,
          bvid: item.bvid,
          cid: selectedCid || item.cid || 0,
          played_time: playedTime,
          play_type: 2,
        }).catch(() => {});
      }
      artRef.current.destroy(true);
      artRef.current = null;
      setIsPlaying(false);
      setVideoUrl(null);
      setDanmakuData("");
    }

    addToPlaylist({
      ...item,
      cid: selectedCid,
    });
    message.success("已加入播放列表");
  };

  const handleDeleteFromWatchLater = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteFromWatchLater && item.id) {
      onDeleteFromWatchLater(item.id.toString());
    }
  };

  const { is_folder, media_count } = item;

  return (
    <div className="video-card" onClick={handleOpenVideo}>
      {/* 封面区域 */}
      <div className="video-cover">
        {isPlaying && videoUrl ? (
          // 视频播放器
          <div className="video-player-container">
            <div className="video-player" onClick={(e) => e.stopPropagation()}>
              <ArtPlayerComponent
                key={videoUrl}
                url={videoUrl}
                danmakuData={danmakuData}
                isLive={item.duration === 0}
                autoSize={false}
                progress={selectedCid === item.cid ? item.progress : undefined}
                getInstance={handleArtInstance}
                onPlay={handleArtPlay}
                onPause={handleArtPause}
              />
            </div>
            <div className="video-close-btn" onClick={handleCloseVideo}>
              <CloseCircleOutlined />
            </div>
          </div>
        ) : (
          <>
            <img
              src={
                item.pic ||
                "https://i0.hdslb.com/bfs/static/jinkela/space/assets/fav-cover.png"
              }
              alt={item.title}
              referrerPolicy="no-referrer"
            />
            {/* 播放图标 - hover 时显示 */}
            {!is_folder && (
              <div
                className="video-play-icon"
                onClick={handlePlayClick}
                style={{ pointerEvents: "auto", cursor: "pointer" }}
                title={item.duration === 0 ? "进入直播间" : "播放"}
              >
                {isLoading ? <LoadingOutlined spin /> : <PlayCircleFilled />}
              </div>
            )}
            {/* 操作按钮区域 - hover 时显示 */}
            {!is_folder && (
              <div className="video-hover-actions">
                {/* 待看列表的删除按钮 */}
                {onDeleteFromWatchLater && (
                  <div
                    className="video-action-btn"
                    onClick={handleDeleteFromWatchLater}
                    title="移除待看"
                  >
                    <DeleteOutlined />
                  </div>
                )}

                {/* 加入待看按钮 */}
                {item.duration !== 0 && item.bvid && onAddToWatchLater && (
                  <div
                    className="video-action-btn"
                    onClick={handleAddToWatchLater}
                    title="稍后再看"
                  >
                    <ClockCircleOutlined />
                  </div>
                )}
                {/* 加入播放列表按钮 */}
                <div
                  className="video-action-btn"
                  onClick={handleAddToPlaylist}
                  title="加入播放列表"
                >
                  <PlusCircleOutlined />
                </div>
              </div>
            )}
            {/* 封面左下角：播放量/视频数 */}
            <div className="video-stats-overlay">
              {is_folder ? (
                <span>共{media_count}个视频</span>
              ) : (
                <>
                  <span>
                    <PlayCircleOutlined /> {formatCount(item.stat.view)}
                  </span>
                  <span>
                    <MessageOutlined /> {formatCount(item.stat.danmaku)}
                  </span>
                </>
              )}
            </div>
            {/* 封面右下角：时长 (收藏夹不显示) */}
            {!is_folder && item.duration === 0 && item.is_followed === 1 && (
              <div className="video-followed-tag">我的关注</div>
            )}
            {!is_folder && (
              <div className="video-duration">
                {item.progress !== undefined && item.progress !== 0
                  ? item.progress === -1
                    ? `${formatDuration(item.duration)}/${formatDuration(item.duration)}`
                    : `${formatDuration(item.progress)}/${formatDuration(item.duration)}`
                  : formatDuration(item.duration)}
              </div>
            )}
            {!is_folder && item.progress !== undefined && item.progress > 0 && (
              <div className="video-progress-bar">
                <div
                  className="video-progress-fill"
                  style={{
                    width: `${Math.min(100, (item.progress / item.duration) * 100)}%`,
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* 标题 */}
      <div
        className="video-title"
        title={item.title}
        onClick={(e) => handlePlayClick(e)}
      >
        {item.title}
      </div>

      {/* 集合视频选集展开按钮 */}
      {!is_folder && item.pages && item.pages.length > 1 && (
        <div
          className="video-pages-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setIsPagesExpanded(!isPagesExpanded);
          }}
        >
          <span>分P选集 ({item.pages.length})</span>
          <span className={`toggle-icon ${isPagesExpanded ? "expanded" : ""}`}>
            ▼
          </span>
        </div>
      )}

      {/* 展开的分P列表 */}
      {!is_folder && isPagesExpanded && item.pages && item.pages.length > 1 && (
        <div className="video-card-pages-list">
          {item.pages.map((page) => (
            <div
              key={page.cid}
              className={`video-card-page-item ${selectedCid === page.cid ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCid(page.cid);
                handlePlayClick(e, page.cid);
              }}
            >
              <div className="page-item-left">
                <span className="page-index">P{page.page}</span>
                <span className="page-part-title" title={page.part}>
                  {page.part}
                </span>
              </div>
              <span className="page-item-duration">
                {formatDuration(page.duration)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 底部信息 */}
      <div className="video-footer">
        {is_folder ? (
          <span className="video-author" style={{ color: "#999" }}>
            创建于 {dayjs.unix(item.pubdate).format("YYYY-MM-DD")}
          </span>
        ) : (
          <>
            {item.owner.face && (
              <img
                className="video-avatar clickable"
                src={item.owner.face}
                alt={item.owner.name}
                referrerPolicy="no-referrer"
                onClick={(e) => {
                  e.stopPropagation();
                  onUserClick?.(item.owner);
                }}
              />
            )}
            <span
              className="video-author clickable"
              onClick={(e) => {
                e.stopPropagation();
                onUserClick?.(item.owner);
              }}
            >
              {item.owner.name}
            </span>
            <span className="video-dot">·</span>
            <span className="video-date">
              {item.pub_time || dayjs.unix(item.pubdate).format("YYYY-MM-DD")}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(VideoCard);
