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
import { Button } from "antd";

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
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const activeIdxRef = useRef<number>(-1);

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
  const songQuality = usePlayerStore((state) => state.songQuality);
  const playMode = usePlayerStore((state) => state.playMode);
  const setPlayMode = usePlayerStore((state) => state.setPlayMode);

  const restoreTimeRef = useRef<number>(0);
  const lastQualityRef = useRef(songQuality);

  const { likedSongMids, toggleLikeSong } = useUserStore();
  const isLiked = currentSong ? likedSongMids.includes(currentSong.mid) : false;
  const effectivePlaySource =
    playSource === "normal" && isRadioMode ? "guess" : playSource;
  const sourceLabel =
    effectivePlaySource === "radar"
      ? "专属雷达"
      : effectivePlaySource === "guess"
        ? "猜你喜欢"
        : "";

  const getAlbumCover = (song: Song): string => {
    if (song.album?.pmid) {
      if (song.album.pmid.startsWith("http")) {
        return song.album.pmid;
      }
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
    if (effectivePlaySource === "guess" && currentSong && playlist.length > 0) {
      const currIdx = playlist.findIndex((s) => s.mid === currentSong.mid);
      const remaining = playlist.length - (currIdx + 1);

      if (currIdx >= 0 && remaining <= 1) {
        getGuessRecommend()
          .then((res) => {
            if (res.code === 0 && res.data) {
              const songs =
                (res.data as any).songs ||
                (res.data as any).tracks ||
                (res.data as any).songlist ||
                (res.data as any).v_song ||
                (res.data as any).list ||
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
  }, [currentSong, playlist, effectivePlaySource, getGuessRecommend]);

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
    if (!audio) return;

    if (isPlaying && currentSongUrl) {
      audio.play().catch((err) => {
        if (err && err.name !== "AbortError") {
          console.error("播放失败:", err);
        }
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSongUrl]);

  // 监控音质改变，保存当前时间
  useEffect(() => {
    if (lastQualityRef.current !== songQuality) {
      if (audioRef.current && isPlaying) {
        restoreTimeRef.current = audioRef.current.currentTime;
      }
      lastQualityRef.current = songQuality;
    }
  }, [songQuality, isPlaying]);

  // Handle auto-fetching the song URL when currentSong or songQuality changes
  useEffect(() => {
    let active = true;
    const fetchUrl = async () => {
      if (!currentSong) {
        setCurrentSongUrl(null);
        return;
      }

      // 切歌时立刻暂停上一首并清除旧 URL
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentSongUrl(null);

      try {
        const res = await getSongUrl(currentSong.mid, songQuality);
        if (!active) return;
        const url = typeof res.data === "string" ? res.data.trim() : "";
        if (res.code === 0 && url && url.startsWith("http")) {
          setCurrentSongUrl(url);
        } else {
          messageApi.error(
            `无法播放《${currentSong.name}》: ${res.message || "获取播放链接为空，可能是VIP或版权限制"}`,
          );
          setCurrentSongUrl(null);
          // 加载失败自动跳下一首
          setTimeout(() => playNext(), 1500);
        }
      } catch {
        if (!active) return;
        messageApi.error(`获取播放链接失败`);
        setCurrentSongUrl(null);
        // 加载失败自动跳下一首
        setTimeout(() => playNext(), 1500);
      }
    };

    fetchUrl();

    return () => {
      active = false;
    };
  }, [
    currentSong,
    currentSong?.mid,
    songQuality,
    getSongUrl,
    setCurrentSongUrl,
    playNext,
    messageApi,
  ]);

  // 获取并解析歌词
  useEffect(() => {
    let active = true;
    if (!currentSong) {
      setLyrics([]);
      setCurrentLyric("");
      activeIdxRef.current = -1;
      setActiveIdx(-1);
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
        activeIdxRef.current = -1;
        setActiveIdx(-1);
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

    // 歌词优先显示，没有歌词时显示歌曲名称
    vscode.postMessage({
      command: "NETEASE_UPDATE_PLAYING_STATUS" as any,
      payload: {
        songName: fullTitle,
        lyric: currentLyric || fullTitle,
        isPlaying,
      },
    });
  }, [currentSong, currentLyric, isPlaying]);

  // 监听来自扩展端的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message?.command === "NETEASE_PLAY_NEXT_COMMAND") {
        playNext();
      } else if (message?.command === "NETEASE_PLAY_PAUSE_COMMAND") {
        togglePlay();
      } else if (message?.command === "NETEASE_PAUSE_COMMAND") {
        usePlayerStore.getState().pause();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [playNext, togglePlay]);

  // 纯逻辑监听：即使 Webview 在后台导致动画帧暂停，音频的原生 timeUpdate 依然会触发
  // 用于确保底部状态栏在后台依然能同步歌词
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.target as HTMLAudioElement;
    if (lyrics.length === 0) return;
    const currTime = audio.currentTime;
    if (lyrics[0].time > currTime) {
      setCurrentLyric("");
      if (activeIdxRef.current !== -1) {
        activeIdxRef.current = -1;
        setActiveIdx(-1);
      }
      return;
    }
    let idx = Math.min(Math.max(activeIdxRef.current, 0), lyrics.length - 1);
    while (idx < lyrics.length - 1 && lyrics[idx + 1].time <= currTime) idx++;
    while (idx > 0 && lyrics[idx].time > currTime) idx--;
    if (idx >= 0) {
      const lineText = lyrics[idx].text;
      setCurrentLyric((prev) => (prev !== lineText ? lineText : prev));
      if (activeIdxRef.current !== idx) {
        activeIdxRef.current = idx;
        setActiveIdx(idx);
      }
    }
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.target as HTMLAudioElement;
    if (restoreTimeRef.current > 0) {
      audio.currentTime = restoreTimeRef.current;
      restoreTimeRef.current = 0;
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSongUrl || undefined}
        preload="auto"
        loop={playMode === "single"}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => playNext()}
        onError={() => {
          if (currentSongUrl) {
            messageApi.error(`播放失败，自动跳到下一首`);
            setTimeout(() => playNext(), 1500);
          }
        }}
      />

      <div
        className={`playbar ${isLyricOpen ? "playbar-expanded" : ""} ${isPlaylistOpen ? "playbar-playlist-open" : ""} ${isPlaying ? "" : "paused"}`}
      >
        {/* DOM顺序调换：在 column-reverse 模式下，第一个元素在最下方渲染。
            我们要让播放列表在控制栏下方展开，所以必须把它放第一位 */}
        <PlaylistDrawer
          isPlaylistOpen={isPlaylistOpen}
          playlist={playlist}
          currentSong={currentSong}
          playSong={(song) => playSong(song, songQuality, effectivePlaySource)}
          removeFromPlaylist={removeFromPlaylist}
          clearPlaylist={clearPlaylist}
          getAlbumCover={getAlbumCover}
          getSingerName={getSingerName}
          playMode={playMode}
          setPlayMode={setPlayMode}
          effectivePlaySource={effectivePlaySource}
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
                <div
                  className={`playbar-lyric ${
                    sourceLabel ? "source-mode" : ""
                  }`}
                  title={sourceLabel || currentLyric}
                >
                  {sourceLabel || currentLyric || "聆听美好音乐"}
                </div>
              </div>
            ) : (
              <div className="playbar-title">暂无播放</div>
            )}
          </div>

          {/* 控制按钮放在右侧，悬浮展开 */}
          <div className="playbar-controls">
            <div className="playbar-action-btns">
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
            </div>
          </div>
        </div>

        <LyricOverlay
          isLyricOpen={isLyricOpen}
          currentSong={currentSong}
          lyrics={lyrics}
          currentLyric={currentLyric}
          activeIdx={activeIdx}
          isPlaying={isPlaying}
          getAlbumCover={getAlbumCover}
          audioRef={audioRef}
        />
      </div>
    </>
  );
};

export default PlayBar;
