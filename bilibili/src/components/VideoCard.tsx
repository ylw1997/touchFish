/*
 * @Description: B站视频卡片组件
 */
import React from "react";
import { PlayCircleOutlined, MessageOutlined } from "@ant-design/icons";
import type { BilibiliListItem } from "../types/bilibili";
import dayjs from "dayjs";

export interface VideoCardProps {
  item: BilibiliListItem;
  onCopyLink?: (url: string) => void;
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

const VideoCard: React.FC<VideoCardProps> = ({ item, showImg = true }) => {
  const handleOpenVideo = () => {
    window.open(item.uri, "_blank");
  };

  return (
    <div className="video-card" onClick={handleOpenVideo}>
      {/* 封面区域 */}
      <div className="video-cover">
        {showImg && (
          <img src={item.pic} alt={item.title} referrerPolicy="no-referrer" />
        )}
        {/* 封面左下角：播放量和弹幕 */}
        <div className="video-stats-overlay">
          <span>
            <PlayCircleOutlined /> {formatCount(item.stat.view)}
          </span>
          <span>
            <MessageOutlined /> {formatCount(item.stat.danmaku)}
          </span>
        </div>
        {/* 封面右下角：时长 */}
        <div className="video-duration">{formatDuration(item.duration)}</div>
      </div>

      {/* 标题 */}
      <div className="video-title" title={item.title}>
        {item.title}
      </div>

      {/* 底部信息：UP主头像 + UP主名称 · 日期 */}
      <div className="video-footer">
        <img
          className="video-avatar"
          src={item.owner.face}
          alt={item.owner.name}
          referrerPolicy="no-referrer"
        />
        <span className="video-author">{item.owner.name}</span>
        <span className="video-dot">·</span>
        <span className="video-date">
          {dayjs.unix(item.pubdate).format("YYYY-MM-DD")}
        </span>
      </div>
    </div>
  );
};

export default React.memo(VideoCard);
