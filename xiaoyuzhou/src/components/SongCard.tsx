import React from "react";
import { Button, Tag, Space, Tooltip, App } from "antd";
import {
  PlusOutlined,
  HeartOutlined,
  HeartFilled,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { getImageUrl } from "../hooks/useXiaoyuzhou";

interface SongCardProps {
  song: any; // 其实是小宇宙的 episode
  isPlaying?: boolean;
  isCurrent?: boolean;
  onPlay?: (song: any) => void;
  onAddToPlaylist?: (song: any) => void;
  onShowDetail?: (song: any) => void;
  showActions?: boolean;
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  isPlaying = false,
  isCurrent = false,
  onPlay,
  onAddToPlaylist,
  onShowDetail,
  showActions = true,
}) => {
  const { message } = App.useApp();
  const isLiked = song.isLiked || false;

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    message.success(isLiked ? "已取消喜欢" : "已喜欢");
  };

  // 格式化时长
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 获取播客名称
  const getSingerName = (): string => {
    return song.podcast?.title || song.podcast?.author || song.author || "未知播客";
  };

  // 获取封面
  const getAlbumCover = (): string => {
    return getImageUrl(song) || "https://assets.xiaoyuzhoufm.com/favicon.ico";
  };

  return (
    <div
      className={`song-card ${isCurrent ? "song-card-playing" : ""}`}
      onClick={() => onPlay?.(song)}
    >
      <div className="song-card-content">
        <div className="song-card-cover">
          <img
            src={getAlbumCover()}
            alt={song.title}
            className="song-cover-img"
            onClick={(e) => {
              if (onShowDetail) {
                e.stopPropagation();
                onShowDetail(song);
              }
            }}
            style={{ cursor: onShowDetail ? "pointer" : "default" }}
          />
          {isPlaying && (
            <div className="song-playing-indicator">
              <span className="playing-bar"></span>
              <span className="playing-bar"></span>
              <span className="playing-bar"></span>
            </div>
          )}
        </div>

        <div className="song-card-info">
          <div className="song-title-row">
            <span className="song-name" title={song.title || song.name}>
              {song.title || song.name || "无标题"}
            </span>
            {song.isPaid && (
              <Tag color="gold" style={{ fontSize: 10, lineHeight: '14px' }}>付费</Tag>
            )}
          </div>
          <div className="song-artist" title={getSingerName()}>
            {getSingerName()}
          </div>
        </div>

        <div className="song-duration">
          <ClockCircleOutlined />
          <span>{formatDuration(song.duration)}</span>
        </div>

        {showActions && (
          <div className="song-actions" onClick={(e) => e.stopPropagation()}>
            <Space>
              <Tooltip title="添加到稍后播放">
                <Button
                  type="text"
                  shape="circle"
                  icon={<PlusOutlined />}
                  onClick={() => onAddToPlaylist?.(song)}
                  size="small"
                />
              </Tooltip>
              <Tooltip title={isLiked ? "取消喜欢" : "喜欢该单集"}>
                <Button
                  type="text"
                  shape="circle"
                  icon={isLiked ? <HeartFilled style={{ color: "#ff4d4f" }} /> : <HeartOutlined />}
                  onClick={handleToggleLike}
                />
              </Tooltip>
            </Space>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongCard;
