import React from "react";
import { PlayCircleFilled, CustomerServiceFilled } from "@ant-design/icons";
import { getImageUrl } from "../hooks/useXiaoyuzhou";

interface PlaylistCardProps {
  playlist: any;
  onClick?: (playlist: any) => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick }) => {
  // 小宇宙通常可能没有listennum，我们可以使用订阅者的数量(subscriptionCount)
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
          alt={playlist.title || playlist.name}
          src={getImageUrl(playlist) || "https://assets.xiaoyuzhoufm.com/favicon.ico"}
          className="playlist-cover"
        />
        <div className="playlist-play-overlay">
          <PlayCircleFilled className="play-icon" />
        </div>
        {playlist.subscriptionCount && (
          <div className="playlist-play-count">
            <CustomerServiceFilled />
            <span>{formatPlayCount(playlist.subscriptionCount)}</span>
          </div>
        )}
      </div>
      <div className="playlist-info">
        <div className="playlist-title" title={playlist.title || playlist.name}>
          {playlist.title || playlist.name}
        </div>
        <div className="playlist-meta">
          <span className="playlist-creator">{playlist.author || "小宇宙播客"}</span>
          <span className="playlist-song-count">{playlist.episodeCount ? `${playlist.episodeCount}集` : ""}</span>
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;
