import React, { useCallback, useEffect, useRef } from "react";
import {
  CaretRightOutlined,
  PauseOutlined,
  PlayCircleFilled,
  UnorderedListOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import { Button, Space } from "antd";

import { usePlayerStore } from "../store/player";
import { getImageUrl, getPlayableUrl } from "../hooks/useXiaoyuzhou";

import { ProgressBar } from "./playbar/ProgressBar";
import { PlaylistDrawer } from "./playbar/PlaylistDrawer";
import { ShownotesDrawer } from "./playbar/ShownotesDrawer";
import { LyricOverlay } from "./playbar/LyricOverlay";
import { useXiaoyuzhou } from "../hooks/useXiaoyuzhou";
import { vscode } from "../utils/vscode";

interface PlayBarProps {
  onOpenPodcast?: (podcast: any) => void;
}

const PlayBar: React.FC<PlayBarProps> = ({ onOpenPodcast }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentEpisode = usePlayerStore((state) => state.currentEpisode);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playlist = usePlayerStore((state) => state.playlist);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
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
  const isLyricOpen = usePlayerStore((state) => state.isLyricOpen);
  const toggleLyricOpen = usePlayerStore((state) => state.toggleLyricOpen);

  const { getEpisodeTranscript } = useXiaoyuzhou();

  const [lyrics, setLyrics] = React.useState<{ time: number; text: string }[]>([]);
  const [currentLyric, setCurrentLyric] = React.useState<string>("");
  const [activeIdx, setActiveIdx] = React.useState<number>(-1);

  const getAlbumCover = (episode: any): string => {
    return (
      getImageUrl(episode) || "https://assets.xiaoyuzhoufm.com/favicon.ico"
    );
  };

  const getPodcastName = (episode: any): string => {
    return (
      episode?.podcast?.title ||
      episode?.podcast?.author ||
      episode?.author ||
      "未知播客"
    );
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "时长未知";
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;

    if (hours > 0) {
      return `${hours}小时 ${remainMins}分钟`;
    }

    return `${mins} 分钟`;
  };

  const openPodcastDrawer = useCallback(() => {
    const pid = currentEpisode?.podcast?.pid || currentEpisode?.pid;
    if (!pid) return;

    if (isPlaylistOpen) {
      togglePlaylistOpen();
    }

    // 调用父组件传入的打开函数
    if (onOpenPodcast) {
      onOpenPodcast({ pid });
    }
  }, [currentEpisode, isPlaylistOpen, togglePlaylistOpen, onOpenPodcast]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, currentEpisode]);

  // Fetch and parse transcript
  useEffect(() => {
    let active = true;
    if (!currentEpisode) {
      setLyrics([]);
      setCurrentLyric("");
      setActiveIdx(-1);
      return;
    }

    const eid = currentEpisode.eid || currentEpisode.id;
    const mediaId = currentEpisode.mediaKey;

    if (eid && mediaId) {
      getEpisodeTranscript(eid, mediaId).then((data) => {
        if (!active) return;
        try {
          // Assume data is an array of transcript segments or has a transcripts property
          const transcripts = Array.isArray(data) ? data : data?.data?.transcripts || data?.transcripts || data?.items || [];
          if (Array.isArray(transcripts) && transcripts.length > 0) {
            const parsed = transcripts.map((t: any) => {
              let val = 0;
              if (t.startTime !== undefined) val = parseFloat(t.startTime);
              else if (t.start !== undefined) val = parseFloat(t.start);
              else if (t.startMs !== undefined) val = Number(t.startMs) / 1000;
              return {
                time: isNaN(val) ? 0 : val,
                text: String(t.text || t.content || ""),
              };
            });
            setLyrics(parsed);
          } else {
            setLyrics([]);
          }
        } catch {
          setLyrics([]);
        }
      });
    } else {
      setLyrics([]);
    }

    return () => {
      active = false;
    };
  }, [currentEpisode, getEpisodeTranscript]);

  useEffect(() => {
    const title = currentEpisode?.title || "";
    vscode.postMessage({
      command: "XIAOYUZHOU_UPDATE_PLAYING_STATUS",
      payload: {
        title: title,
        lyric: currentLyric,
        isPlaying: isPlaying,
      },
    });
  }, [currentEpisode, currentLyric, isPlaying]);

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.target as HTMLAudioElement;
    if (lyrics.length === 0) return;
    const currTime = audio.currentTime;
    let idx = lyrics.length - 1;
    while (idx >= 0 && lyrics[idx].time > currTime) {
      idx--;
    }
    if (idx >= 0) {
      const lineText = lyrics[idx].text;
      setCurrentLyric((prev) => (prev !== lineText ? lineText : prev));
      setActiveIdx((prev) => (prev !== idx ? idx : prev));
    }
  };

  useEffect(() => {
    let animationFrameId: number;
    const findLyric = () => {
      if (audioRef.current && lyrics.length > 0) {
        const currTime = audioRef.current.currentTime;
        let idx = lyrics.length - 1;
        while (idx >= 0 && lyrics[idx].time > currTime) {
          idx--;
        }
        if (idx >= 0) {
          const currentLine = lyrics[idx];
          const nextLine = lyrics[idx + 1];
          const duration = nextLine ? nextLine.time - currentLine.time : 4;
          let progress = ((currTime - currentLine.time) / duration) * 100;
          if (progress > 100) progress = 100;

          const lyricList = document.querySelector(".playbar-lyric-overlay");
          if (lyricList) {
            const targetEl = lyricList.querySelector(
              `.lyric-line[data-index="${idx}"]`,
            ) as HTMLElement;
            if (targetEl) {
              targetEl.style.setProperty("--lyric-progress-raw", `${progress}`);
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(findLyric);
    };
    animationFrameId = requestAnimationFrame(findLyric);
    return () => cancelAnimationFrame(animationFrameId);
  }, [lyrics]);

  return (
    <>
      <audio
        ref={audioRef}
        src={getPlayableUrl(currentEpisode)}
        preload="metadata"
        onEnded={() => playNext()}
        onTimeUpdate={handleTimeUpdate}
      />

      <div
        className={`playbar ${isLyricOpen ? "playbar-expanded" : ""} ${isPlaylistOpen ? "playbar-playlist-open" : ""} ${isPlaying ? "" : "paused"}`}
      >
        <PlaylistDrawer
          isPlaylistOpen={isPlaylistOpen}
          playlist={playlist}
          currentIndex={currentIndex}
          playSong={play}
          removeFromPlaylist={removeFromPlaylist}
          clearPlaylist={clearPlaylist}
          getAlbumCover={getAlbumCover}
          getSingerName={getPodcastName}
        />

        <div className="playbar-bottom">
          <ProgressBar audioRef={audioRef} variant="background" />

          <div
            className={`playbar-video-wrapper ${isLyricOpen ? "expanded-mode" : ""}`}
            style={{
              cursor: "pointer",
              margin: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => {
              if (!isLyricOpen && currentEpisode) toggleLyricOpen();
            }}
            title={!isLyricOpen ? "展开" : ""}
          >
            {currentEpisode ? (
              isLyricOpen ? (
                <Button
                  color="default"
                  shape="circle"
                  variant="filled"
                  icon={<FullscreenExitOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLyricOpen();
                  }}
                  title="收起"
                />
              ) : (
                <img
                  className={`playbar-video ${isPlaying ? "playing" : ""}`}
                  src={getAlbumCover(currentEpisode)}
                  alt={currentEpisode.title}
                  referrerPolicy="no-referrer"
                  style={{ cursor: "pointer" }}
                  title="展开字幕"
                />
              )
            ) : (
              <div className="playbar-video-loading">
                <PlayCircleFilled style={{ fontSize: 24, opacity: 0.5 }} />
              </div>
            )}
          </div>

          <div className="playbar-info" style={{ cursor: "default" }}>
            {currentEpisode ? (
              <div className="playbar-text-info">
                <div
                  className="playbar-title"
                  title={`${currentEpisode.title} - ${getPodcastName(currentEpisode)}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleShownotesOpen()}
                >
                  <span className="song-name">{currentEpisode.title}</span>
                </div>
                <div className="playbar-lyric">
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={(event) => {
                      event.stopPropagation();
                      void openPodcastDrawer();
                    }}
                  >
                    {getPodcastName(currentEpisode)}
                  </span>
                  {` - ${formatDuration(currentEpisode.duration)}`}
                </div>
              </div>
            ) : (
              <div className="playbar-title">暂无播放</div>
            )}
          </div>

          <Space size="small" style={{ marginLeft: "auto" }}>
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
                togglePlaylistOpen();
              }}
              title="播放列表"
            >
              <UnorderedListOutlined />
            </Button>
          </Space>
        </div>

        <LyricOverlay
          isLyricOpen={isLyricOpen}
          currentEpisode={currentEpisode}
          lyrics={lyrics}
          currentLyric={currentLyric}
          activeIdx={activeIdx}
          getAlbumCover={getAlbumCover}
          audioRef={audioRef}
        />
      </div>

      <ShownotesDrawer
        open={isShownotesOpen}
        onClose={() => toggleShownotesOpen()}
        episode={currentEpisode}
      />
    </>
  );
};

export default PlayBar;
