/**
 * 歌单卡片组件
 */
import React from "react";
import { PlayCircleFilled, CustomerServiceFilled } from "@ant-design/icons";
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
    <div className="playlist-card" onClick={() => onClick?.(playlist)}>
      <div className="playlist-cover-wrapper">
        <img
          alt={playlist.dissname}
          src={
            playlist.logo ||
            playlist.diss_cover ||
            "https://y.gtimg.cn/mediastyle/global/img/playlist_300.png"
          }
          className="playlist-cover"
        />
        <div className="playlist-play-overlay">
          <PlayCircleFilled className="play-icon" />
        </div>
        {playlist.listennum && (
          <div className="playlist-play-count">
            <CustomerServiceFilled />
            <span>{formatPlayCount(playlist.listennum)}</span>
          </div>
        )}
      </div>
      <div className="playlist-info">
        <div className="playlist-title" title={playlist.dissname}>
          {playlist.dissname}
        </div>
        <div className="playlist-meta">
          <span className="playlist-creator">{playlist.nick || "QQ音乐"}</span>
          <span className="playlist-song-count">{playlist.songnum}首</span>
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;
