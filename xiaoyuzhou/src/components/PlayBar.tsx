import React, { useEffect, useRef } from "react";
import {
  CaretRightOutlined,
  FullscreenExitOutlined,
  HeartFilled,
  HeartOutlined,
  PauseOutlined,
  PlayCircleFilled,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { App, Button, Space } from "antd";
import { AnimatePresence, motion } from "framer-motion";

import { usePlayerStore } from "../store/player";
import { useUserStore } from "../store/user";
import { getImageUrl, getPlayableUrl } from "../hooks/useXiaoyuzhou";

import { ProgressBar } from "./playbar/ProgressBar";
import { PlaylistDrawer } from "./playbar/PlaylistDrawer";

const PlayBar: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { message } = App.useApp();

  const currentEpisode = usePlayerStore((state) => state.currentEpisode);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playlist = usePlayerStore((state) => state.playlist);
  const isPlaylistOpen = usePlayerStore((state) => state.isPlaylistOpen);
  const isShownotesOpen = usePlayerStore((state) => state.isShownotesOpen);

  const togglePlaylistOpen = usePlayerStore(
    (state) => state.togglePlaylistOpen,
  );
  const toggleShownotesOpen = usePlayerStore(
    (state) => state.toggleShownotesOpen,
  );
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const playNext = usePlayerStore((state) => state.playNext);
  const removeFromPlaylist = usePlayerStore(
    (state) => state.removeFromPlaylist,
  );
  const clearPlaylist = usePlayerStore((state) => state.clearPlaylist);
  const play = usePlayerStore((state) => state.play);

  const { likedSongMids, toggleLikeSong } = useUserStore();
  const isLiked = currentEpisode
    ? likedSongMids.includes(currentEpisode.eid || currentEpisode.pid)
    : false;

  const getAlbumCover = (episode: any): string => {
    return getImageUrl(episode) || "https://assets.xiaoyuzhoufm.com/favicon.ico";
  };

  const getSingerName = (episode: any): string => {
    return (
      episode.podcast?.title ||
      episode.podcast?.author ||
      episode.author ||
      "未知播客"
    );
  };

  const handleToggleLike = async () => {
    if (!currentEpisode) return;
    toggleLikeSong(currentEpisode.eid || currentEpisode.pid);
    message.success(isLiked ? "已取消喜欢" : "已喜欢该播客");
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, currentEpisode]);

  return (
    <>
      <audio
        ref={audioRef}
        src={getPlayableUrl(currentEpisode)}
        preload="metadata"
        onEnded={() => playNext()}
      />

      <div
        className={`playbar ${isShownotesOpen ? "playbar-expanded" : ""} ${isPlaylistOpen ? "playbar-playlist-open" : ""} ${isPlaying ? "" : "paused"}`}
      >
        <AnimatePresence initial={false}>
          {isShownotesOpen && currentEpisode ? (
            <motion.div
              key="shownotes"
              className="playbar-shownotes-container"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <motion.div
                className="playbar-shownotes-content"
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="playbar-shownotes-title">{currentEpisode.title}</h2>
                <div
                  className="xy-html playbar-shownotes-html"
                  dangerouslySetInnerHTML={{
                    __html: currentEpisode.shownotes || "<p>暂无 Shownotes</p>",
                  }}
                />
                <div className="playbar-shownotes-spacer"></div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!isShownotesOpen ? (
          <PlaylistDrawer
            isPlaylistOpen={isPlaylistOpen}
            playlist={playlist}
            currentSong={currentEpisode}
            playSong={play}
            removeFromPlaylist={removeFromPlaylist}
            clearPlaylist={clearPlaylist}
            getAlbumCover={getAlbumCover}
            getSingerName={getSingerName}
          />
        ) : null}

        <div className="playbar-bottom">
          <ProgressBar audioRef={audioRef} />

          <div
            className={`playbar-video-wrapper ${isShownotesOpen ? "expanded-mode" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              if (currentEpisode) toggleShownotesOpen();
            }}
          >
            {currentEpisode ? (
              isShownotesOpen ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    shape="circle"
                    color="default"
                    variant="filled"
                    icon={<FullscreenExitOutlined />}
                    style={{
                      border: "none",
                      background: "rgba(120, 120, 120, 0.2)",
                    }}
                  />
                </div>
              ) : (
                <img
                  className={`playbar-video ${isPlaying ? "playing" : ""}`}
                  src={getAlbumCover(currentEpisode)}
                  alt={currentEpisode.title}
                  referrerPolicy="no-referrer"
                />
              )
            ) : (
              <div className="playbar-video-loading">
                <PlayCircleFilled style={{ fontSize: 24, opacity: 0.5 }} />
              </div>
            )}
          </div>

          <div
            className="playbar-info"
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (currentEpisode && !isShownotesOpen) {
                if (isPlaylistOpen) togglePlaylistOpen();
                toggleShownotesOpen();
              }
            }}
          >
            {currentEpisode ? (
              <div className="playbar-text-info">
                <div
                  className="playbar-title"
                  title={`${currentEpisode.title} - ${getSingerName(currentEpisode)}`}
                >
                  <span className="song-name">{currentEpisode.title}</span>
                  <span className="playbar-singer">
                    {" - " + getSingerName(currentEpisode)}
                  </span>
                </div>
                <div
                  className="playbar-lyric"
                  style={{
                    opacity: isShownotesOpen ? 0 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {currentEpisode.duration
                    ? `${Math.floor(currentEpisode.duration / 60)} 分钟`
                    : "聆听播客探索"}
                </div>
              </div>
            ) : (
              <div className="playbar-title">暂无播放</div>
            )}
          </div>

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
              onClick={handleToggleLike}
              title={isLiked ? "取消喜欢" : "喜欢"}
            />

            <Button
              color="default"
              variant="filled"
              onClick={(event) => {
                event.stopPropagation();
                togglePlay();
              }}
              title={isPlaying ? "暂停" : "播放"}
              shape="circle"
            >
              {isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
            </Button>

            <Button
              color={isPlaylistOpen ? "primary" : "default"}
              shape="circle"
              variant="filled"
              onClick={(event) => {
                event.stopPropagation();
                if (isShownotesOpen) toggleShownotesOpen();
                togglePlaylistOpen();
              }}
              title="播放列表"
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
