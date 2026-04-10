import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CaretRightOutlined,
  HeartFilled,
  HeartOutlined,
  PauseOutlined,
  PlayCircleFilled,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { App, Avatar, Button, Drawer, List, Space, Spin } from "antd";

import { usePlayerStore } from "../store/player";
import { useUserStore } from "../store/user";
import {
  getImageUrl,
  getPlayableUrl,
  useXiaoyuzhou,
} from "../hooks/useXiaoyuzhou";

import { ProgressBar } from "./playbar/ProgressBar";
import { PlaylistDrawer } from "./playbar/PlaylistDrawer";
import { ShownotesDrawer } from "./playbar/ShownotesDrawer";

const PlayBar: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { message } = App.useApp();
  const { getPodcastDetail } = useXiaoyuzhou();

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

  const [podcastOpen, setPodcastOpen] = useState(false);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [podcastDetail, setPodcastDetail] = useState<any | null>(null);
  const [podcastEpisodes, setPodcastEpisodes] = useState<any[]>([]);

  const getAlbumCover = (episode: any): string => {
    return getImageUrl(episode) || "https://assets.xiaoyuzhoufm.com/favicon.ico";
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

  const openPodcastDrawer = useCallback(async () => {
    const pid = currentEpisode?.podcast?.pid || currentEpisode?.pid;
    if (!pid) return;

    if (isPlaylistOpen) {
      togglePlaylistOpen();
    }

    setPodcastOpen(true);
    setPodcastLoading(true);
    try {
      const detail = await getPodcastDetail(pid);
      setPodcastDetail(detail?.podcast || null);
      setPodcastEpisodes(detail?.episodes || []);
    } finally {
      setPodcastLoading(false);
    }
  }, [currentEpisode, getPodcastDetail, isPlaylistOpen, togglePlaylistOpen]);

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
        className={`playbar ${isPlaylistOpen ? "playbar-playlist-open" : ""} ${isPlaying ? "" : "paused"}`}
      >
        <PlaylistDrawer
          isPlaylistOpen={isPlaylistOpen}
          playlist={playlist}
          currentSong={currentEpisode}
          playSong={play}
          removeFromPlaylist={removeFromPlaylist}
          clearPlaylist={clearPlaylist}
          getAlbumCover={getAlbumCover}
          getSingerName={getPodcastName}
        />

        <div className="playbar-bottom">
          <ProgressBar audioRef={audioRef} />

          <div className="playbar-video-wrapper">
            {currentEpisode ? (
              <img
                className={`playbar-video ${isPlaying ? "playing" : ""}`}
                src={getAlbumCover(currentEpisode)}
                alt={currentEpisode.title}
                referrerPolicy="no-referrer"
                onClick={() => toggleShownotesOpen()}
                style={{ cursor: "pointer" }}
              />
            ) : (
              <div className="playbar-video-loading">
                <PlayCircleFilled style={{ fontSize: 24, opacity: 0.5 }} />
              </div>
            )}
          </div>

          <div
            className="playbar-info"
            style={{ cursor: currentEpisode ? "pointer" : "default" }}
            onClick={() => {
              void openPodcastDrawer();
            }}
          >
            {currentEpisode ? (
              <div className="playbar-text-info">
                <div
                  className="playbar-title"
                  title={`${currentEpisode.title} - ${getPodcastName(currentEpisode)}`}
                >
                  <span className="song-name">{currentEpisode.title}</span>
                </div>
                <div className="playbar-lyric">
                  {`${getPodcastName(currentEpisode)} -- ${formatDuration(currentEpisode.duration)}`}
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
                togglePlaylistOpen();
              }}
              title="播放列表"
            >
              <UnorderedListOutlined />
            </Button>
          </Space>
        </div>
      </div>

      <Drawer
        title={podcastDetail?.title || getPodcastName(currentEpisode) || "频道详情"}
        placement="bottom"
        height="82%"
        open={podcastOpen}
        onClose={() => setPodcastOpen(false)}
      >
        <div style={{ padding: "10px" }}>
          {podcastLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "40px",
              }}
            >
              <Spin size="large" />
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <Avatar
                    src={getImageUrl(podcastDetail || currentEpisode)}
                    size={56}
                  />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>
                      {podcastDetail?.title || getPodcastName(currentEpisode)}
                    </div>
                    <div style={{ opacity: 0.7, marginTop: 4 }}>
                      {podcastDetail?.author || podcastDetail?.subtitle || ""}
                    </div>
                  </div>
                </div>
                <div style={{ lineHeight: 1.7, opacity: 0.88 }}>
                  {podcastDetail?.brief ||
                    podcastDetail?.description ||
                    "暂无频道简介"}
                </div>
              </div>

              <List
                header={<div style={{ fontWeight: 700 }}>最近单集</div>}
                dataSource={podcastEpisodes}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        key="play"
                        type="link"
                        style={{ color: "var(--vscode-textLink-foreground)" }}
                        onClick={() => {
                          play(item);
                          setPodcastOpen(false);
                        }}
                      >
                        播放
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={
                            item?.podcast?.image?.smallPicUrl ||
                            item?.image?.smallPicUrl
                          }
                        />
                      }
                      title={item?.title || "未命名单集"}
                    />
                  </List.Item>
                )}
              />
            </>
          )}
        </div>
      </Drawer>
      <ShownotesDrawer
        open={isShownotesOpen}
        onClose={() => toggleShownotesOpen()}
        episode={currentEpisode}
      />
    </>
  );
};

export default PlayBar;
