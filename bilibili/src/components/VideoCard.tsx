/*
 * @Description: B站视频卡片组件
 */
import React from "react";
import {
  PlayCircleOutlined,
  PlayCircleFilled,
  MessageOutlined,
  ClockCircleOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import type { BilibiliListItem } from "../types/bilibili";
import { usePlayerStore } from "../store/player";
import dayjs from "dayjs";

export interface VideoCardProps {
  item: BilibiliListItem;
  onCopyLink?: (url: string) => void;
  onAddToWatchLater?: (bvid: string) => void;
  showImg?: boolean;
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
  showImg = true,
  onAddToWatchLater,
}) => {
  const { addToPlaylist } = usePlayerStore();

  const handleOpenVideo = () => {
    window.open(item.uri, "_blank");
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
  };

  const { is_folder, media_count } = item;

  return (
    <div className="video-card" onClick={handleOpenVideo}>
      {/* 封面区域 */}
      <div className="video-cover">
        {showImg && (
          <img
            src={
              item.pic ||
              "https://i0.hdslb.com/bfs/static/jinkela/space/assets/fav-cover.png"
            }
            alt={item.title}
            referrerPolicy="no-referrer"
          />
        )}
        {/* 播放图标 - hover 时显示 */}
        {!is_folder && (
          <div className="video-play-icon">
            <PlayCircleFilled />
          </div>
        )}
        {/* 操作按钮区域 - hover 时显示 */}
        {!is_folder && (
          <div className="video-hover-actions">
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
          <div className="video-duration">{formatDuration(item.duration)}</div>
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
