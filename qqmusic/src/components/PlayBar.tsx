import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UnorderedListOutlined,
  CloseOutlined,
  DeleteOutlined,
  PauseOutlined,
  CaretRightOutlined,
  PlayCircleFilled,
  HeartOutlined,
  HeartFilled,
} from "@ant-design/icons";
import { Button, Space, message } from "antd";
import { usePlayerStore } from "../store/player";
import { useUserStore } from "../store/user";
import { useQQMusic } from "../hooks/useQQMusic";
import type { Song } from "../types/qqmusic";

const PlayBar: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { playSong, getSongUrl } = useQQMusic();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const {
    currentSong,
    currentSongUrl,
    setCurrentSongUrl,
    isPlaying,
    playlist,
    isPlaylistOpen,
    togglePlaylistOpen,
    togglePlay,
    playNext,
    removeFromPlaylist,
    clearPlaylist,
  } = usePlayerStore();

  const { likedSongMids, toggleLikeSong } = useUserStore();
  const isLiked = currentSong ? likedSongMids.includes(currentSong.mid) : false;

  // 播放/暂停控制
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSongUrl) return;

    if (isPlaying) {
      audio.play().catch((err) => console.error("播放失败:", err));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSongUrl]);

  // Handle auto-fetching the song URL when currentSong changes
  useEffect(() => {
    let active = true;
    const fetchUrl = async () => {
      if (!currentSong) {
        setCurrentSongUrl(null);
        return;
      }
      try {
        const res = await getSongUrl(currentSong.mid);
        if (!active) return;
        if (res.code === 0 && res.data) {
          setCurrentSongUrl(res.data);
        } else {
          message.error(`无法播放《${currentSong.name}》: 可能是VIP或独家单曲`);
          setCurrentSongUrl(null);
        }
      } catch (err: any) {
        if (!active) return;
        message.error(`获取拉取链接失败: ${err.message}`);
        setCurrentSongUrl(null);
      }
    };

    fetchUrl();

    return () => {
      active = false;
    };
  }, [currentSong, currentSong?.mid, getSongUrl, setCurrentSongUrl]);

  const getSingerName = (song: Song): string => {
    if (!song.singer || song.singer.length === 0) return "未知歌手";
    return song.singer.map((s) => s.name).join(" / ");
  };

  const getAlbumCover = (song: Song): string => {
    if (song.album?.pmid) {
      return `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.album.pmid}.jpg`;
    }
    return "https://y.gtimg.cn/mediastyle/global/img/album_300.png";
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlay();
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSongUrl || ""}
        preload="metadata"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => playNext()}
      />

      <div
        className={`playbar ${isPlaylistOpen ? "playbar-playlist-open" : ""}`}
      >
        <AnimatePresence>
          {isPlaylistOpen && (
            <motion.div
              className="playbar-playlist-inner"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="playbar-playlist-header">
                <span className="playbar-playlist-title">
                  播放列表 ({playlist.length})
                </span>
                {playlist.length > 0 && (
                  <Button
                    color="red"
                    variant="filled"
                    onClick={clearPlaylist}
                    title="清空列表"
                    shape="circle"
                  >
                    <DeleteOutlined />
                  </Button>
                )}
              </div>
              <div className="playbar-playlist-content">
                {playlist.length === 0 ? (
                  <div className="playbar-playlist-empty">暂无歌曲</div>
                ) : (
                  playlist.map((song, index) => (
                    <div
                      key={song.mid + index}
                      className={`playbar-playlist-item ${
                        currentSong?.mid === song.mid ? "active" : ""
                      }`}
                      onClick={() => playSong(song)}
                    >
                      <img src={getAlbumCover(song)} alt={song.name} />
                      <div className="playbar-playlist-item-info">
                        <div className="playbar-playlist-item-title">
                          {song.name}
                        </div>
                        <div className="playbar-playlist-item-author">
                          {getSingerName(song)}
                        </div>
                      </div>
                      <span
                        className="playbar-playlist-item-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromPlaylist(index);
                        }}
                      >
                        <CloseOutlined />
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="playbar-bottom">
          <div
            className="playbar-progress-bg"
            style={{ width: `${progress}%` }}
          />
          <div className="playbar-video-wrapper">
            {currentSong ? (
              <img
                className={`playbar-video ${isPlaying ? "playing" : ""}`}
                src={getAlbumCover(currentSong)}
                alt={currentSong.name}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="playbar-video-loading">
                <PlayCircleFilled style={{ fontSize: 24, opacity: 0.5 }} />
              </div>
            )}
          </div>

          <div className="playbar-info">
            {currentSong ? (
              <div className="playbar-text-info">
                <div className="playbar-title" title={currentSong.name}>
                  {currentSong.name}
                </div>
                <div
                  className="playbar-author"
                  title={getSingerName(currentSong)}
                >
                  {getSingerName(currentSong)}
                </div>
              </div>
            ) : (
              <div className="playbar-title">暂无播放</div>
            )}
          </div>

          {/* 控制按钮放在右侧，仿 Bilibili 风格 */}
          <Space size="small" style={{ marginLeft: "auto" }}>
            <Button
              color="default"
              shape="circle"
              variant="filled"
              icon={
                isLiked ? (
                  <HeartFilled style={{ color: "#ff4d4f" }} />
                ) : (
                  <HeartOutlined />
                )
              }
              onClick={() => currentSong && toggleLikeSong(currentSong.mid)}
              title={isLiked ? "取消我喜欢" : "添加到我喜欢"}
            />

            <Button
              color="default"
              variant="filled"
              onClick={handlePlayPause}
              title={isPlaying ? "暂停" : "播放"}
              shape="circle"
            >
              {isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
            </Button>

            <Button
              color={isPlaylistOpen ? "primary" : "default"}
              variant="filled"
              onClick={togglePlaylistOpen}
              title="播放列表"
              shape="circle"
            >
              <UnorderedListOutlined />
            </Button>
          </Space>
        </div>
      </div>
    </>
  );
};

export default PlayBar;
