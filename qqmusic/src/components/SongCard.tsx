/**
 * 歌曲卡片组件
 */
import React from "react";
import { Button, Tag, Space, Tooltip } from "antd";
import {
  PlusOutlined,
  HeartOutlined,
  HeartFilled,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { Song } from "../types/qqmusic";
import { useUserStore } from "../store/user";
import { useQQMusic } from "../hooks/useQQMusic";

interface SongCardProps {
  song: Song;
  isPlaying?: boolean;
  isCurrent?: boolean;
  onPlay?: (song: Song) => void;
  onAddToPlaylist?: (song: Song) => void;
  showActions?: boolean;
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  isPlaying = false,
  isCurrent = false,
  onPlay,
  onAddToPlaylist,
  showActions = true,
}) => {
  const { likedSongMids, toggleLikeSong } = useUserStore();
  const { addSongsToPlaylist, removeSongsFromPlaylist, messageApi } = useQQMusic();
  const isLiked = likedSongMids.includes(song.mid);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!song.id) {
      messageApi.error("歌曲 ID 缺失，无法同步状态");
      return;
    }
    try {
      if (isLiked) {
        const res = await removeSongsFromPlaylist(201, [song.id]);
        if (res.code === 0) {
          toggleLikeSong(song.mid);
          messageApi.success("已从我喜欢的列表中移除");
        } else {
          messageApi.error("操作失败: " + res.message);
        }
      } else {
        const res = await addSongsToPlaylist(201, [song.id]);
        if (res.code === 0) {
          toggleLikeSong(song.mid);
          messageApi.success("已添加到我喜欢的列表");
        } else {
          messageApi.error("操作失败: " + res.message);
        }
      }
    } catch (err: any) {
      messageApi.error("操作异常: " + err.message);
    }
  };

  // 格式化时长
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 获取歌手名
  const getSingerName = (): string => {
    if (!song.singer || song.singer.length === 0) return "未知歌手";
    return song.singer.map((s) => s.name).join(" / ");
  };

  // 获取专辑封面
  const getAlbumCover = (): string => {
    if (song.album?.pmid) {
      return `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.album.pmid}.jpg`;
    }
    return "https://y.gtimg.cn/mediastyle/global/img/album_300.png";
  };

  return (
    <div
      className={`song-card ${isCurrent ? "song-card-playing" : ""}`}
      onClick={() => onPlay?.(song)}
    >
      <div className="song-card-content">
        {/* 封面 */}
        <div className="song-card-cover">
          <img
            src={getAlbumCover()}
            alt={song.name}
            className="song-cover-img"
          />
          {isPlaying && (
            <div className="song-playing-indicator">
              <span className="playing-bar"></span>
              <span className="playing-bar"></span>
              <span className="playing-bar"></span>
            </div>
          )}
        </div>

        {/* 歌曲信息 */}
        <div className="song-card-info">
          <div className="song-title-row">
            <span className="song-name" title={song.name}>
              {song.name}
            </span>
            {song.pay?.pay_play === 1 && (
              <Tag color="gold" style={{ fontSize: 10, lineHeight: '14px' }}>VIP</Tag>
            )}
            {song.isonly === 1 && (
              <Tag color="blue" style={{ fontSize: 10, lineHeight: '14px' }}>独家</Tag>
            )}
          </div>
          <div className="song-artist" title={getSingerName()}>
            {getSingerName()}
          </div>
          <div className="song-album" title={song.album?.name}>
            {song.album?.name || "未知专辑"}
          </div>
        </div>

        {/* 时长 */}
        <div className="song-duration">
          <ClockCircleOutlined />
          <span>{formatDuration(song.interval)}</span>
        </div>

        {/* 操作按钮 */}
        {showActions && (
          <div className="song-actions" onClick={(e) => e.stopPropagation()}>
            <Space>
              <Tooltip title="添加到播放列表">
                <Button
                  type="text"
                  shape="circle"
                  icon={<PlusOutlined />}
                  onClick={() => onAddToPlaylist?.(song)}
                  size="small"
                />
              </Tooltip>
              <Tooltip title={isLiked ? "取消我喜欢" : "添加到我喜欢"}>
                <Button
              type="text"
              shape="circle"
              icon={
                isLiked ? (
                  <HeartFilled style={{ color: "#ff4d4f" }} />
                ) : (
                  <HeartOutlined />
                )
              }
              onClick={handleToggleLike}
            />  </Tooltip>
            </Space>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongCard;
