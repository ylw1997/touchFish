import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UnorderedListOutlined,
  CloseOutlined,
  DeleteOutlined,
  PauseOutlined,
  CaretRightOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  PlayCircleFilled,
} from "@ant-design/icons";
import { Button, Space } from "antd";
import { usePlayerStore } from "../store/player";
import type { Song } from "../types/qqmusic";

const PlayBar: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    currentSong,
    currentSongUrl,
    isPlaying,
    playlist,
    isPlaylistOpen,
    togglePlaylistOpen,
    togglePlay,
    playNext,
    playPrev,
    removeFromPlaylist,
    clearPlaylist,
    play,
  } = usePlayerStore();

  // 音频事件监听
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => playNext();
    const handleError = () => console.error("音频加载失败");

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [playNext]);

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
      <audio ref={audioRef} src={currentSongUrl || ""} preload="metadata" />

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
                      onClick={() => play(song)}
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
          <div className="playbar-video-wrapper">
            {currentSong ? (
              <img
                className="playbar-video"
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
              type="text"
              shape="circle"
              icon={<StepBackwardOutlined />}
              onClick={playPrev}
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
              type="text"
              shape="circle"
              icon={<StepForwardOutlined />}
              onClick={playNext}
            />

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
