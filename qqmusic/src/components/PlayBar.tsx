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
  StepForwardOutlined,
} from "@ant-design/icons";
import { Button, Space, message } from "antd";
import { usePlayerStore } from "../store/player";
import { useUserStore } from "../store/user";
import { useQQMusic } from "../hooks/useQQMusic";
import { vscode } from "../utils/vscode";
import type { Song } from "../types/qqmusic";

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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [currentLyric, setCurrentLyric] = useState<string>("");
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
    isRadioMode,
    openSingerDrawer,
  } = usePlayerStore();

  const { likedSongMids, toggleLikeSong } = useUserStore();
  const isLiked = currentSong ? likedSongMids.includes(currentSong.mid) : false;

  // 猜你喜欢 (电台) 自动续播预加载
  useEffect(() => {
    if (isRadioMode && currentSong && playlist.length > 0) {
      const currIdx = playlist.findIndex((s) => s.mid === currentSong.mid);
      const remaining = playlist.length - (currIdx + 1);

      if (currIdx >= 0 && remaining <= 1) {
        console.log("[PlayBar] 电台队列快空了，自动预加载下一批...");
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
                // 过滤掉已经在列表中的歌曲，防止重复
                const newSongs = songs.filter(
                  (s: Song) => !player.playlist.some((p) => p.mid === s.mid),
                );
                if (newSongs.length > 0) {
                  newSongs.forEach((s: Song) => player.addToPlaylist(s));
                  console.log(
                    `[PlayBar] 电台成功追加 ${newSongs.length} 首歌曲`,
                  );
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
          // 检查是否大概率是 Base64 (不包含 [ 等 LRC 标志)
          if (lyricStr && !lyricStr.includes("[")) {
            lyricStr = decodeURIComponent(escape(window.atob(lyricStr)));
          }
        } catch (err) {
          console.error("[PlayBar] 歌词解码失败:", err);
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
            if (text) {
              parsed.push({ time, text });
            }
          }
        }
        setLyrics(parsed);
        // 重置当前行
        setCurrentLyric("");
      }
    });

    return () => {
      active = false;
    };
  }, [currentSong, currentSong?.mid, getLyric]);

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

  // 监听来自扩展端的消息（如状态栏点击下一首、暂停/播放）
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
        onTimeUpdate={(e) => {
          const currTime = e.currentTarget.currentTime;
          setCurrentTime(currTime);
          if (lyrics.length > 0) {
            const line = lyrics.filter((l) => l.time <= currTime).pop();
            if (line && line.text !== currentLyric) {
              setCurrentLyric(line.text);
            }
          }
        }}
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
                <div
                  className="playbar-title"
                  title={`${currentSong.name} - ${getSingerName(currentSong)}`}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span>{currentSong.name}</span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "rgba(255, 255, 255, 0.45)",
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
                  className="playbar-lyric"
                  style={{
                    fontSize: "12px",
                    color: "rgba(255, 255, 255, 0.85)",
                    marginTop: "2px",
                    minHeight: "16px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={currentLyric}
                >
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
              onClick={handlePlayPause}
              title={isPlaying ? "暂停" : "播放"}
              shape="circle"
            >
              {isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
            </Button>
            <Button
              color="default"
              shape="circle"
              variant="filled"
              icon={<StepForwardOutlined />}
              onClick={playNext}
              title="下一首"
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
