/**
 * 歌单卡片组件
 */
import React from "react";
import {
  PlayCircleOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";
import type { Playlist } from "../types/qqmusic";

interface PlaylistCardProps {
  playlist: Playlist;
  onClick?: (playlist: Playlist) => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick }) => {
  // 格式化播放量
  const formatPlayCount = (count?: number): string => {
    if (!count) return "0";
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + "万";
    }
    return count.toString();
  };

  return (
    <div className="video-card" onClick={() => onClick?.(playlist)}>
      <div className="video-cover">
        <img
          alt={playlist.dissname}
          src={
            playlist.logo ||
            playlist.diss_cover ||
            "https://y.gtimg.cn/mediastyle/global/img/playlist_300.png"
          }
        />
        <PlayCircleOutlined className="video-play-icon" />
        {playlist.listennum && (
          <div className="video-stats-overlay">
            <span>
              <CustomerServiceOutlined />
              {formatPlayCount(playlist.listennum)}
            </span>
          </div>
        )}
        <div className="video-duration">{playlist.songnum}首</div>
      </div>
      <div className="video-title" title={playlist.dissname}>
        {playlist.dissname}
      </div>
      <div className="video-footer">
        <span className="video-author">{playlist.nick || "QQ音乐"}</span>
      </div>
    </div>
  );
};

export default PlaylistCard;
