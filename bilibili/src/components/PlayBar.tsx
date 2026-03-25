/*
 * @Description: 悬浮播放条组件
 */
import React, { useRef, useEffect, useMemo, useCallback } from "react";
import {
  UnorderedListOutlined,
  CloseOutlined,
  DeleteOutlined,
  LoadingOutlined,
  PauseOutlined,
  CaretRightOutlined,
  PlayCircleFilled,
  FullscreenExitOutlined,
  SwitcherOutlined,
} from "@ant-design/icons";
import { usePlayerStore } from "../store/player";
import { useRequest } from "../hooks/useRequest";
import { BilibiliApi } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import ArtPlayerComponent from "./ArtPlayerComponent";
import Artplayer from "artplayer";
import { App, Button } from "antd";

const PlayBar: React.FC = () => {
  const { message } = App.useApp();
  const {
    currentVideo,
    videoUrl,
    isPlaying,
    playlist,
    isPlaylistOpen,
    isExpanded,
    togglePlay,
    togglePlaylistOpen,
    toggleExpand,
    setCurrentVideo,
    setVideoUrl,
    setIsPlaying,
    removeFromPlaylist,
    clearPlaylist,
    playNext,
  } = usePlayerStore();

  const videoRef = useRef<Artplayer | null>(null);
  const requestSeqRef = useRef(0);
  const lastVideoIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [danmakuData, setDanmakuData] = React.useState<string>("");
  const [isPip, setIsPip] = React.useState(false);

  const { request } = useRequest();
  const apiClient = useMemo(() => new BilibiliApi(request), [request]);

  const fetchPlayUrl = useCallback(
    async (video: typeof currentVideo) => {
      if (!video) return;

      const requestId = ++requestSeqRef.current;
      const isStaleRequest = () =>
        requestId !== requestSeqRef.current ||
        usePlayerStore.getState().currentVideo?.id !== video.id;

      setIsLoading(true);

      try {
        if (video.duration === 0) {
          const result = await apiClient.getLivePlayUrl(video.id);
          if (
            !isStaleRequest() &&
            result.code === 0 &&
            result.data?.durl?.[0]?.url
          ) {
            setVideoUrl(result.data.durl[0].url);
            setDanmakuData("");
          }
          return;
        }

        const result = await apiClient.getPlayUrl(video.bvid, video.cid);
        if (
          !isStaleRequest() &&
          result.code === 0 &&
          result.data?.durl?.[0]?.url
        ) {
          setVideoUrl(result.data.durl[0].url);

          try {
            const danmakuRes = await apiClient.getDanmaku(video.cid);
            if (!isStaleRequest() && danmakuRes.code === 0) {
              setDanmakuData(danmakuRes.data);
            }
          } catch (error) {
            console.error("获取弹幕失败", error);
          }
        }
      } finally {
        if (requestId === requestSeqRef.current) {
          setIsLoading(false);
        }
      }
    },
    [apiClient, setVideoUrl],
  );

  useEffect(() => {
    if (!currentVideo) {
      requestSeqRef.current += 1;
      lastVideoIdRef.current = null;
      setIsLoading(false);
      setDanmakuData("");
      setVideoUrl(null);
      return;
    }

    if (currentVideo.id !== lastVideoIdRef.current) {
      lastVideoIdRef.current = currentVideo.id;
      setDanmakuData("");
      setVideoUrl(null);
      fetchPlayUrl(currentVideo);
    }
  }, [currentVideo, fetchPlayUrl, setVideoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handlePlayVideo = (video: typeof currentVideo) => {
    if (video) {
      setDanmakuData("");
      setCurrentVideo(video);
    }
  };

  const handlePlayPause = () => {
    if (currentVideo) {
      if (!videoUrl && !isLoading) {
        fetchPlayUrl(currentVideo);
      }
      togglePlay();
    }
  };

  const handleVideoEnded = useCallback(() => {
    playNext();
  }, [playNext]);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentVideo) {
      toggleExpand();
    }
  };

  const handlePipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.pip = !videoRef.current.pip;
    }
  };

  const handleArtInstance = useCallback(
    (art: Artplayer) => {
      videoRef.current = art;

      if (usePlayerStore.getState().isPlaying) {
        art.play().catch(() => {});
        art.once("ready", () => {
          art.play().catch(() => {});
        });
        setIsPlaying(true);
      }

      art.on("pip", (state: boolean) => {
        setIsPip(state);
      });
    },
    [setIsPlaying],
  );

  const handleArtPlay = useCallback(() => {
    setIsPlaying(true);
  }, [setIsPlaying]);

  const handleArtPause = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  const handleArtError = useCallback(
    (error: unknown) => {
      const liveVideo = usePlayerStore.getState().currentVideo;
      if (!liveVideo || liveVideo.duration !== 0) {
        return;
      }

      console.error("Live playback failed, removing from playlist:", error);
      removeFromPlaylist(liveVideo.id);
      setVideoUrl(null);
      setDanmakuData("");
      message.error("直播播放失败，已从播放列表移除");
    },
    [message, removeFromPlaylist, setVideoUrl],
  );

  const style = useMemo(
    () =>
      ({
        width: "100%",
        height: "100%",
        minHeight: "0",
        pointerEvents: isExpanded ? "auto" : "none",
      }) as React.CSSProperties,
    [isExpanded],
  );

  useEffect(() => {
    if (videoRef.current) {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.autoSize();
        }
      }, 100);
    }
  }, [isExpanded]);

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="playbar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={handleExpandClick}
          />
        )}
      </AnimatePresence>

      <div
        className={`playbar ${isExpanded ? "playbar-expanded" : ""} ${
          isPlaylistOpen ? "playbar-playlist-open" : ""
        }`}
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
                  <div className="playbar-playlist-empty">暂无视频</div>
                ) : (
                  playlist.map((video) => (
                    <div
                      key={video.id}
                      className={`playbar-playlist-item ${
                        currentVideo?.id === video.id ? "active" : ""
                      }`}
                      onClick={() => handlePlayVideo(video)}
                    >
                      <img
                        src={video.pic}
                        alt={video.title}
                        referrerPolicy="no-referrer"
                      />
                      <div className="playbar-playlist-item-info">
                        <div className="playbar-playlist-item-title">
                          {video.title}
                        </div>
                        <div className="playbar-playlist-item-author">
                          {video.owner.name}
                        </div>
                      </div>
                      <span
                        className="playbar-playlist-item-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromPlaylist(video.id);
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
            className="playbar-video-wrapper"
            onClick={(e) => {
              if (!isExpanded && currentVideo) {
                e.stopPropagation();
                toggleExpand();
              }
            }}
          >
            {currentVideo ? (
              <div
                className="playbar-video"
                style={{ width: "100%", height: "100%", position: "relative" }}
              >
                {isLoading && (
                  <div
                    className="playbar-video-loading"
                    style={{
                      position: "absolute",
                      zIndex: 10,
                      background: "rgba(0,0,0,0.5)",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <LoadingOutlined
                      spin
                      style={{ fontSize: 24, color: "#fff" }}
                    />
                  </div>
                )}

                {videoUrl && (
                  <ArtPlayerComponent
                    url={videoUrl}
                    danmakuData={danmakuData}
                    isLive={currentVideo.duration === 0}
                    getInstance={handleArtInstance}
                    onPlay={handleArtPlay}
                    onPause={handleArtPause}
                    onEnded={handleVideoEnded}
                    onError={handleArtError}
                    style={style}
                    controls={isExpanded}
                  />
                )}

                {!videoUrl && !isLoading && (
                  <img
                    className="playbar-video"
                    src={currentVideo.pic}
                    alt={currentVideo.title}
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            ) : (
              <div className="playbar-video-loading">
                <PlayCircleFilled style={{ fontSize: 24, opacity: 0.5 }} />
              </div>
            )}
          </div>

          {isExpanded && (
            <Button
              color="default"
              variant="filled"
              onClick={handleExpandClick}
              title="收起"
              shape="circle"
            >
              <FullscreenExitOutlined />
            </Button>
          )}

          <div className="playbar-info" onClick={handleExpandClick}>
            {currentVideo ? (
              <div className="playbar-text-info">
                <div className="playbar-title" title={currentVideo.title}>
                  {currentVideo.title}
                </div>
                <div className="playbar-author" title={currentVideo.owner.name}>
                  {currentVideo.owner.name}
                </div>
              </div>
            ) : (
              <div className="playbar-title">暂无播放</div>
            )}
          </div>

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
            color={isPip ? "primary" : "default"}
            variant="filled"
            onClick={handlePipClick}
            title="视频画中画"
            shape="circle"
            disabled={!videoUrl}
          >
            <SwitcherOutlined />
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
        </div>
      </div>
    </>
  );
};

export default PlayBar;
