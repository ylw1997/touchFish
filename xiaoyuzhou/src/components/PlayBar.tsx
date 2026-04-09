import React, { useRef, useEffect } from "react";
import {
  UnorderedListOutlined,
  PauseOutlined,
  CaretRightOutlined,
  PlayCircleFilled,
  HeartOutlined,
  HeartFilled,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import { Button, Space, App } from "antd";

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
  
  const togglePlaylistOpen = usePlayerStore((state) => state.togglePlaylistOpen);
  const toggleShownotesOpen = usePlayerStore((state) => state.toggleShownotesOpen);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const playNext = usePlayerStore((state) => state.playNext);
  const removeFromPlaylist = usePlayerStore((state) => state.removeFromPlaylist);
  const clearPlaylist = usePlayerStore((state) => state.clearPlaylist);
  const play = usePlayerStore((state) => state.play);

  const { likedSongMids, toggleLikeSong } = useUserStore();
  // 伪造判断点赞状态
  const isLiked = currentEpisode ? likedSongMids.includes(currentEpisode.eid || currentEpisode.pid) : false;

  const getAlbumCover = (ep: any): string => {
    return getImageUrl(ep) || "https://assets.xiaoyuzhoufm.com/favicon.ico";
  };

  const getSingerName = (ep: any): string => {
    return ep.podcast?.title || ep.podcast?.author || ep.author || "未知播客";
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

        <div className="playbar-bottom">
          <ProgressBar audioRef={audioRef} />

          <div
            className={`playbar-video-wrapper ${isShownotesOpen ? "expanded-mode" : ""}`}
            style={{
              cursor: "pointer",
              margin: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => {
              if (!isShownotesOpen && currentEpisode) toggleShownotesOpen();
            }}
            title={!isShownotesOpen ? "展开 Shownotes" : ""}
          >
            {isShownotesOpen ? (
              <Button
                color="default"
                shape="circle"
                variant="filled"
                icon={<FullscreenExitOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleShownotesOpen();
                }}
                title="收起"
              />
            ) : currentEpisode ? (
              <img
                className={`playbar-video ${isPlaying ? "playing" : ""}`}
                src={getAlbumCover(currentEpisode)}
                alt={currentEpisode.title}
                referrerPolicy="no-referrer"
              />
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
              if (!isShownotesOpen && currentEpisode) toggleShownotesOpen();
            }}
          >
            {currentEpisode ? (
              <div className="playbar-text-info">
                <div
                  className="playbar-title"
                  title={`${currentEpisode.title} - ${getSingerName(currentEpisode)}`}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span>{currentEpisode.title}</span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "normal",
                    }}
                  >
                    -
                    <span className="playbar-singer">
                      {" " + getSingerName(currentEpisode)}
                    </span>
                  </span>
                </div>
                <div className="playbar-lyric">
                     {currentEpisode.duration ? `${Math.floor(currentEpisode.duration / 60)} 分钟` : "聆听博客探索"}
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
              onClick={handleToggleLike}
              title={isLiked ? "取消喜欢" : "喜欢"}
            />

            <Button
              color="default"
              variant="filled"
              onClick={(e) => {
                e.stopPropagation();
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
              onClick={(e) => {
                e.stopPropagation();
                togglePlaylistOpen();
              }}
              title="播放列表"
            >
              <UnorderedListOutlined />
            </Button>
          </Space>
        </div>
        
        {/* 小宇宙特有：展开时渲染 Shownotes（原本原QQ音乐是渲染 LyricOverlay 结构动画） */}
        {isShownotesOpen && currentEpisode && (
          <div className="playbar-lyric-overlay" style={{
              position: 'absolute',
              top: 0,
              left: 45,
              right: 0,
              height: 'calc(100% - 66px)',
              padding: '24px 30px',
              overflowY: 'auto',
              color: 'var(--vscode-foreground)',
              fontSize: '14px',
              lineHeight: 1.6
          }}>
             <h2 style={{ fontSize: 20, marginBottom: 16 }}>{currentEpisode.title}</h2>
             <div 
                className="xy-html" 
                dangerouslySetInnerHTML={{ __html: currentEpisode.shownotes || "<p>暂无 Shownotes</p>" }} 
             />
             <div style={{ paddingBottom: 100 }}></div>
          </div>
        )}
      </div>
    </>
  );
};

export default PlayBar;
