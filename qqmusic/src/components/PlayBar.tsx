/**
 * 播放器底部控制条
 */
import React, { useRef, useEffect } from "react";
import {
  Button,
  Slider,
  Space,
  Tooltip,
  Drawer,
  List,
  Empty,
  Popover,
  Select,
} from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  DeleteOutlined,
  ClearOutlined,
  SoundOutlined,
  MutedOutlined,
  UnorderedListOutlined,
  CloseOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { usePlayerStore } from "../store/player";
import { SongQuality } from "../types/qqmusic";
import type { Song } from "../types/qqmusic";

const PlayBar: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const {
    currentSong,
    currentSongUrl,
    isPlaying,
    currentTime,
    duration,
    volume,
    playlist,
    currentIndex,
    songQuality,
    isPlaylistOpen,
    togglePlaylistOpen,
    setCurrentTime,
    setDuration,
    setVolume,
    togglePlay,
    playNext,
    playPrev,
    removeFromPlaylist,
    clearPlaylist,
    setSongQuality,
  } = usePlayerStore();

  // 音频事件监听
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      playNext();
    };

    const handleError = () => {
      console.error("音频加载失败");
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [setCurrentTime, setDuration, playNext]);

  // 播放/暂停控制
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSongUrl) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error("播放失败:", err);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSongUrl]);

  // 音量控制
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // 格式化时间
  const formatTime = (time: number): string => {
    if (!time || isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 获取歌手名
  const getSingerName = (song: Song): string => {
    if (!song.singer || song.singer.length === 0) return "未知歌手";
    return song.singer.map((s) => s.name).join(" / ");
  };

  // 获取专辑封面
  const getAlbumCover = (song: Song): string => {
    if (song.album?.pmid) {
      return `https://y.gtimg.cn/music/photo_new/T002R150x150M000${song.album.pmid}.jpg`;
    }
    return "https://y.gtimg.cn/mediastyle/global/img/album_300.png";
  };

  // 音质选项
  const qualityOptions = [
    { label: "标准", value: SongQuality.STANDARD },
    { label: "高品质", value: SongQuality.HIGH },
    { label: "无损", value: SongQuality.LOSSLESS },
  ];

  // 如果没有当前歌曲，不显示播放器
  if (!currentSong) {
    return null;
  }

  return (
    <>
      {/* 音频元素 */}
      <audio ref={audioRef} src={currentSongUrl || ""} preload="metadata" />

      {/* 播放器条 */}
      <div className="qqmusic-playbar">
        {/* 进度条 */}
        <div className="qqmusic-playbar-progress">
          <span className="time-current">{formatTime(currentTime)}</span>
          <Slider
            value={currentTime}
            max={duration || 100}
            onChange={(value) => {
              if (audioRef.current) {
                audioRef.current.currentTime = value;
                setCurrentTime(value);
              }
            }}
            className="progress-slider"
            tooltip={{ formatter: (val) => formatTime(val || 0) }}
          />
          <span className="time-total">{formatTime(duration)}</span>
        </div>

        {/* 控制区域 */}
        <div className="qqmusic-playbar-controls">
          {/* 歌曲信息 */}
          <div className="qqmusic-playbar-song-info">
            <img
              src={getAlbumCover(currentSong)}
              alt={currentSong.name}
              className="qqmusic-playbar-cover"
            />
            <div className="qqmusic-playbar-song-meta">
              <div className="qqmusic-playbar-song-name" title={currentSong.name}>
                {currentSong.name}
              </div>
              <div className="qqmusic-playbar-singer" title={getSingerName(currentSong)}>
                {getSingerName(currentSong)}
              </div>
            </div>
          </div>

          {/* 播放控制 */}
          <div className="qqmusic-playbar-play-controls">
            <Space>
              <Tooltip title="上一首">
                <Button
                  type="text"
                  shape="circle"
                  icon={<StepBackwardOutlined />}
                  onClick={playPrev}
                  size="large"
                />
              </Tooltip>
              <Tooltip title={isPlaying ? "暂停" : "播放"}>
                <Button
                  type="primary"
                  shape="circle"
                  icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                  onClick={togglePlay}
                  size="large"
                />
              </Tooltip>
              <Tooltip title="下一首">
                <Button
                  type="text"
                  shape="circle"
                  icon={<StepForwardOutlined />}
                  onClick={playNext}
                  size="large"
                />
              </Tooltip>
            </Space>
          </div>

          {/* 右侧控制 */}
          <div className="qqmusic-playbar-right-controls">
            <Space>
              {/* 音质选择 */}
              <Popover
                content={
                  <Select
                    value={songQuality}
                    options={qualityOptions}
                    onChange={(value) => setSongQuality(value as SongQuality)}
                    style={{ width: 100 }}
                  />
                }
                title="音质选择"
                trigger="click"
              >
                <Button type="text" icon={<SettingOutlined />}>
                  {qualityOptions.find((q) => q.value === songQuality)?.label}
                </Button>
              </Popover>

              {/* 音量控制 */}
              <Popover
                content={
                  <Slider
                    value={volume}
                    max={1}
                    step={0.1}
                    onChange={(val) => setVolume(val)}
                    style={{ width: 100 }}
                  />
                }
                title="音量"
                trigger="click"
              >
                <Button
                  type="text"
                  icon={volume === 0 ? <MutedOutlined /> : <SoundOutlined />}
                />
              </Popover>

              {/* 播放列表 */}
              <Tooltip title="播放列表">
                <Button
                  type={isPlaylistOpen ? "primary" : "text"}
                  icon={<UnorderedListOutlined />}
                  onClick={togglePlaylistOpen}
                >
                  {playlist.length}
                </Button>
              </Tooltip>
            </Space>
          </div>
        </div>
      </div>

      {/* 播放列表抽屉 */}
      <Drawer
        title={`播放列表 (${playlist.length}首)`}
        placement="right"
        open={isPlaylistOpen}
        onClose={togglePlaylistOpen}
        width={400}
        className="playlist-drawer"
        extra={
          <Space>
            <Tooltip title="清空列表">
              <Button
                type="text"
                danger
                icon={<ClearOutlined />}
                onClick={clearPlaylist}
              />
            </Tooltip>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={togglePlaylistOpen}
            />
          </Space>
        }
      >
        {playlist.length === 0 ? (
          <Empty description="播放列表为空" />
        ) : (
          <List
            dataSource={playlist}
            renderItem={(song, index) => (
              <List.Item
                className={`playlist-item ${
                  index === currentIndex ? "playlist-item-current" : ""
                }`}
                actions={[
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeFromPlaylist(index)}
                  />,
                ]}
                onClick={() => {
                  usePlayerStore.getState().play(song);
                }}
              >
                <List.Item.Meta
                  avatar={
                    <img
                      src={getAlbumCover(song)}
                      alt={song.name}
                      className="playlist-item-cover"
                    />
                  }
                  title={song.name}
                  description={getSingerName(song)}
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </>
  );
};

export default PlayBar;
