import React from "react";
import { Button, Tag, Space, Tooltip } from "antd";
import {
  PlusOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { getImageUrl } from "../hooks/useXiaoyuzhou";

interface SongCardProps {
  song: any;
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
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSingerName = (): string => {
    return (
      song.podcast?.title ||
      song.podcast?.author ||
      song.author ||
      "未知播客"
    );
  };

  const getAlbumCover = (): string => {
    return getImageUrl(song) || "https://assets.xiaoyuzhoufm.com/favicon.ico";
  };

  const handleCardClick = () => {
    if (onShowDetail) {
      onShowDetail(song);
      return;
    }
    onPlay?.(song);
  };

  return (
    <div
      className={`song-card ${isCurrent ? "song-card-playing" : ""}`}
      onClick={handleCardClick}
    >
      <div className="song-card-content">
        <div className="song-card-cover">
          <img
            src={getAlbumCover()}
            alt={song.title}
            className="song-cover-img"
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
              <Tag color="gold" style={{ fontSize: 10, lineHeight: "14px" }}>
                付费
              </Tag>
            )}
          </div>
          <div className="song-artist-row" style={{ fontSize: "12px", opacity: 0.7, color: "var(--vscode-descriptionForeground)" }}>
            <span className="song-artist" title={getSingerName()}>
              {getSingerName()}
            </span>
            <span style={{ margin: "0 4px", opacity: 0.5 }}>-</span>
            <span className="song-duration">{formatDuration(song.duration)}</span>
          </div>
        </div>

        {showActions && (
          <div className="song-actions" onClick={(e) => e.stopPropagation()}>
            <Space>
              <Tooltip title="播放">
                <Button
                  type="text"
                  shape="circle"
                  icon={<PlayCircleOutlined />}
                  onClick={() => onPlay?.(song)}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="加入播放列表">
                <Button
                  type="text"
                  shape="circle"
                  icon={<PlusOutlined />}
                  onClick={() => onAddToPlaylist?.(song)}
                  size="small"
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
