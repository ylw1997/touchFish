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

export interface VideoCardProps {
  item: BilibiliListItem;
  onCopyLink?: (url: string) => void;
  onAddToWatchLater?: (bvid: string) => void;
  onDeleteFromWatchLater?: (avid: string) => void;
  onGetPlayUrl?: (
    bvid: string,
    cid: number
  ) => Promise<BilibiliPlayUrlResponse>;
  onGetDanmaku?: (cid: number) => Promise<BilibiliDanmakuResponse>;
  onError?: (message: string) => void;
}

// 格式化播放量
const formatCount = (count: number): string => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + "万";
  }
  return count.toString();
};

// 格式化时长
const formatDuration = (seconds: number): string => {
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
  onGetDanmaku,
}) => {
  const { message } = App.useApp();
  const { addToPlaylist } = usePlayerStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [danmakuData, setDanmakuData] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleOpenVideo = () => {
    // 在VSCode扩展中不能打开网页，仅用于阻止事件
  };

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onGetPlayUrl) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await onGetPlayUrl(item.bvid, item.cid);
      if (result.code === 0 && result.data?.durl?.[0]?.url) {
        setVideoUrl(result.data.durl[0].url);

        // 获取弹幕
        if (onGetDanmaku && item.cid) {
          try {
            const danmakuRes = await onGetDanmaku(item.cid);
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

  const handleCloseVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(false);
    setVideoUrl(null);
    setDanmakuData("");
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleAddToWatchLater = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToWatchLater && item.bvid) {
      onAddToWatchLater(item.bvid);
    }
  };

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToPlaylist(item);
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
              <ArtPlayerComponent url={videoUrl} danmakuData={danmakuData} />
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
                {item.bvid && onAddToWatchLater && (
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
            {!is_folder && (
              <div className="video-duration">
                {formatDuration(item.duration)}
              </div>
            )}
          </>
        )}
      </div>

      {/* 标题 */}
      <div className="video-title" title={item.title}>
        {item.title}
      </div>

      {/* 底部信息 */}
      <div className="video-footer">
        {is_folder ? (
          <span className="video-author" style={{ color: "#999" }}>
            创建于 {dayjs.unix(item.pubdate).format("YYYY-MM-DD")}
          </span>
        ) : (
          <>
            <img
              className="video-avatar"
              src={item.owner.face}
              alt={item.owner.name}
              referrerPolicy="no-referrer"
            />
            <span className="video-author">{item.owner.name}</span>
            <span className="video-dot">·</span>
            <span className="video-date">
              {item.pub_time || dayjs.unix(item.pubdate).format("MM-DD")}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(VideoCard);
