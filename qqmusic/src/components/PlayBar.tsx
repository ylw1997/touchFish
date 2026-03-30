import React, { useRef, useEffect, useState } from "react";
import {
  UnorderedListOutlined,
  PauseOutlined,
  CaretRightOutlined,
  PlayCircleFilled,
  HeartOutlined,
  HeartFilled,
  StepForwardOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import { Button, Space, message } from "antd";

import { usePlayerStore } from "../store/player";
import { useUserStore } from "../store/user";
import { useQQMusic } from "../hooks/useQQMusic";
import { vscode } from "../utils/vscode";
import type { Song } from "../types/qqmusic";

import { ProgressBar } from "./playbar/ProgressBar";
import { LyricOverlay } from "./playbar/LyricOverlay";
import { PlaylistDrawer } from "./playbar/PlaylistDrawer";

const PlayBar: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    playSong,
    getSongUrl,
    addSongsToPlaylist,
    removeSongsFromPlaylist,
    messageApi,
    getGuessRecommend,
    getLyric,
  } = useQQMusic();

  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [currentLyric, setCurrentLyric] = useState<string>("");

  const currentSong = usePlayerStore((state) => state.currentSong);
  const currentSongUrl = usePlayerStore((state) => state.currentSongUrl);
  const setCurrentSongUrl = usePlayerStore((state) => state.setCurrentSongUrl);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const playlist = usePlayerStore((state) => state.playlist);
  const isPlaylistOpen = usePlayerStore((state) => state.isPlaylistOpen);
  const isLyricOpen = usePlayerStore((state) => state.isLyricOpen);
  const togglePlaylistOpen = usePlayerStore(
    (state) => state.togglePlaylistOpen,
  );
  const toggleLyricOpen = usePlayerStore((state) => state.toggleLyricOpen);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const playNext = usePlayerStore((state) => state.playNext);
  const removeFromPlaylist = usePlayerStore(
    (state) => state.removeFromPlaylist,
  );
  const clearPlaylist = usePlayerStore((state) => state.clearPlaylist);
  const isRadioMode = usePlayerStore((state) => state.isRadioMode);
  const openSingerDrawer = usePlayerStore((state) => state.openSingerDrawer);
  const playSource = usePlayerStore((state) => state.playSource);

  const { likedSongMids, toggleLikeSong } = useUserStore();
  const isLiked = currentSong ? likedSongMids.includes(currentSong.mid) : false;

  const getAlbumCover = (song: Song): string => {
    if (song.album?.pmid) {
      return `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.album.pmid}.jpg`;
    }
    return "https://y.gtimg.cn/mediastyle/global/img/album_300.png";
  };

  const getSingerName = (song: Song): string => {
    if (!song.singer || song.singer.length === 0) return "未知歌手";
    return song.singer.map((s) => s.name).join(" / ");
  };

  // 猜你喜欢 (电台) 自动续播预加载
  useEffect(() => {
    if (isRadioMode && currentSong && playlist.length > 0) {
      const currIdx = playlist.findIndex((s) => s.mid === currentSong.mid);
      const remaining = playlist.length - (currIdx + 1);

      if (currIdx >= 0 && remaining <= 1) {
        getGuessRecommend()
          .then((res) => {
            if (res.code === 0 && res.data) {
              const songs =
                res.data.tracks ||
                res.data.songlist ||
                res.data.v_song ||
                res.data.list ||
                [];
              if (songs.length > 0) {
                const player = usePlayerStore.getState();
                const newSongs = songs.filter(
                  (s: Song) => !player.playlist.some((p) => p.mid === s.mid),
                );
                if (newSongs.length > 0) {
                  newSongs.forEach((s: Song) => player.addToPlaylist(s));
                }
              }
            }
          })
          .catch((err) => console.error("[PlayBar] 续播加载失败:", err));
      }
    }
  }, [currentSong, playlist, isRadioMode, getGuessRecommend]);

  const handleToggleLike = async () => {
    if (!currentSong) return;
    if (!currentSong.id) {
      messageApi.error("歌曲 ID 缺失，无法操作");
      return;
    }
    try {
      if (isLiked) {
        const res = await removeSongsFromPlaylist(201, [currentSong.id]);
        if (res.code === 0) {
          toggleLikeSong(currentSong.mid);
          messageApi.success("已从我喜欢的列表中移除");
        } else {
          messageApi.error("操作失败: " + res.message);
        }
      } else {
        const res = await addSongsToPlaylist(201, [currentSong.id]);
        if (res.code === 0) {
          toggleLikeSong(currentSong.mid);
          messageApi.success("已添加到我喜欢的列表");
        } else {
          messageApi.error("操作失败: " + res.message);
        }
      }
    } catch (err: any) {
      messageApi.error("操作异常: " + err.message);
    }
  };

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
      } catch {
        if (!active) return;
        message.error(`获取拉取链接失败`);
        setCurrentSongUrl(null);
      }
    };

    fetchUrl();

    return () => {
      active = false;
    };
  }, [currentSong, currentSong?.mid, getSongUrl, setCurrentSongUrl]);

  // 获取并解析歌词
  useEffect(() => {
    let active = true;
    if (!currentSong) {
      setLyrics([]);
      setCurrentLyric("");
      return;
    }

    getLyric(currentSong.mid).then((res) => {
      if (active && res.code === 0 && res.data) {
        let lyricStr = res.data;
        try {
          if (lyricStr && !lyricStr.includes("[")) {
            lyricStr = decodeURIComponent(escape(window.atob(lyricStr)));
          }
        } catch {
          console.error("获取歌词失败");
        }

        const lines = lyricStr.split("\n");
        const parsed: { time: number; text: string }[] = [];
        const timeRegex = /\[(\d+):(\d+\.\d+)\]/;

        for (const line of lines) {
          const matches = timeRegex.exec(line);
          if (matches) {
            const min = parseInt(matches[1], 10);
            const sec = parseFloat(matches[2]);
            const time = min * 60 + sec;
            const text = line.replace(timeRegex, "").trim();
            if (text) parsed.push({ time, text });
          }
        }
        setLyrics(parsed);
        setCurrentLyric("");
      }
    });

    return () => {
      active = false;
    };
  }, [currentSong, currentSong?.mid, getLyric]);

  // 同步播放状态到 VS Code 状态栏
  useEffect(() => {
    const songName = currentSong ? currentSong.name : "";
    const singerName = currentSong ? getSingerName(currentSong) : "";
    const fullTitle = songName ? `${songName} - ${singerName}` : "";

    vscode.postMessage({
      command: "QQMUSIC_UPDATE_PLAYING_STATUS",
      payload: {
        songName: fullTitle,
        lyric: currentLyric,
        isPlaying,
      },
    });
  }, [currentSong, currentLyric, isPlaying]);

  // 监听独立时钟来更新歌词状态 (替代原先的 onTimeUpdate state)
  useEffect(() => {
    let animationFrameId: number;
    let lastActiveLyric = currentLyric;

    const findLyric = () => {
      if (audioRef.current && lyrics.length > 0) {
        const currTime = audioRef.current.currentTime;
        const line = lyrics.filter((l) => l.time <= currTime).pop();
        if (line && line.text !== lastActiveLyric) {
          lastActiveLyric = line.text;
          setCurrentLyric(line.text); // 只在跨越新歌词时触发重绘
        }
      }
      animationFrameId = requestAnimationFrame(findLyric);
    };

    animationFrameId = requestAnimationFrame(findLyric);
    return () => cancelAnimationFrame(animationFrameId);
  }, [lyrics, currentLyric]);

  // 监听来自扩展端的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message?.command === "QQMUSIC_PLAY_NEXT_COMMAND") {
        playNext();
      } else if (message?.command === "QQMUSIC_PLAY_PAUSE_COMMAND") {
        togglePlay();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [playNext, togglePlay]);

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSongUrl || ""}
        preload="metadata"
        onEnded={() => playNext()}
      />

      <div
        className={`playbar ${isLyricOpen ? "playbar-expanded" : ""} ${isPlaylistOpen ? "playbar-playlist-open" : ""} ${playSource === "radar" ? "playbar-radar" : playSource === "guess" ? "playbar-guess" : ""} ${isPlaying ? "" : "paused"}`}
      >
        <div className="playbar-bottom">
          <ProgressBar audioRef={audioRef} />

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
              if (!isLyricOpen && currentSong) toggleLyricOpen();
            }}
            title={!isLyricOpen ? "展开" : ""}
          >
            {isLyricOpen ? (
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
            ) : currentSong ? (
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

          <div
            className="playbar-info"
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (!isLyricOpen && currentSong) toggleLyricOpen();
            }}
          >
            {currentSong ? (
              <div className="playbar-text-info">
                <div
                  className="playbar-title"
                  title={`${currentSong.name} - ${getSingerName(currentSong)}`}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span>{currentSong.name}</span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "normal",
                    }}
                  >
                    -
                    {currentSong.singer.map((s, index) => (
                      <span
                        key={s.mid || index}
                        onClick={(e) => {
                          e.stopPropagation();
                          openSingerDrawer(s.mid, s.name);
                        }}
                        className="playbar-singer"
                      >
                        {" " + s.name}
                        {index < currentSong.singer.length - 1 ? " / " : ""}
                      </span>
                    ))}
                  </span>
                </div>
                <div className="playbar-lyric" title={currentLyric}>
                  {currentLyric || "聆听美好音乐"}
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
              title={isLiked ? "取消我喜欢" : "添加到我喜欢"}
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
              color="default"
              shape="circle"
              variant="filled"
              onClick={(e) => {
                e.stopPropagation();
                playNext();
              }}
              title="下一首"
            >
              <StepForwardOutlined />
            </Button>

            <Button
              color="default"
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

        <LyricOverlay
          isLyricOpen={isLyricOpen}
          currentSong={currentSong}
          lyrics={lyrics}
          currentLyric={currentLyric}
          getAlbumCover={getAlbumCover}
        />

        <PlaylistDrawer
          isPlaylistOpen={isPlaylistOpen}
          playlist={playlist}
          currentSong={currentSong}
          playSong={playSong}
          removeFromPlaylist={removeFromPlaylist}
          clearPlaylist={clearPlaylist}
          getAlbumCover={getAlbumCover}
          getSingerName={getSingerName}
        />
      </div>
    </>
  );
};

export default PlayBar;
