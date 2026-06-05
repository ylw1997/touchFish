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
  CommentOutlined,
} from "@ant-design/icons";
import { usePlayerStore } from "../store/player";
import { useRequest } from "../hooks/useRequest";
import { BilibiliApi } from "../api";
import { motion, AnimatePresence } from "framer-motion";
import ArtPlayerComponent from "./ArtPlayerComponent";
import Artplayer from "artplayer";
import { App, Button } from "antd";
import { useBilibiliHeartbeat } from "../hooks/useBilibiliHeartbeat";

const PlayBar: React.FC = () => {
  const { message } = App.useApp();
  const {
    currentVideo,
    videoUrl,
    isPlaying,
    playlist,
    isPlaylistOpen,
    isExpanded,
    isDanmakuOpen,
    togglePlay,
    togglePlaylistOpen,
    toggleExpand,
    toggleDanmakuOpen,
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
  const lastVideoCidRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [danmakuData, setDanmakuData] = React.useState<string>("");

  const { request } = useRequest();
  const apiClient = useMemo(() => new BilibiliApi(request), [request]);

  const videoInfo = React.useMemo(
    () =>
      currentVideo
        ? {
            aid: currentVideo.id,
            bvid: currentVideo.bvid,
            cid: currentVideo.cid || 0,
            duration: currentVideo.duration,
          }
        : null,
    [currentVideo]
  );

  const {
    reportPlay,
    reportPause,
    reportEnded,
    setIgnorePause,
    resetState,
  } = useBilibiliHeartbeat({
    apiClient,
    artRef: videoRef,
    videoInfo,
    isPlaying,
  });

  const handlePlaybackFailure = useCallback(
    (
      video: NonNullable<typeof currentVideo>,
      error: unknown,
      options?: {
        removeFailedLive?: boolean;
        messageText?: string;
      },
    ) => {
      if (usePlayerStore.getState().currentVideo?.id !== video.id) {
        return;
      }

      console.error("Playback failed:", error);
      requestSeqRef.current += 1;
      setIsLoading(false);
      setVideoUrl(null);
      setDanmakuData("");
      setIsPlaying(false);
      setIgnorePause(false);

      if (video.duration === 0 && options?.removeFailedLive) {
        removeFromPlaylist(video.id);
      }

      if (options?.messageText) {
        message.error(options.messageText);
      }
    },
    [message, removeFromPlaylist, setIsPlaying, setVideoUrl, setIgnorePause],
  );

  const fetchPlayUrl = useCallback(
    async (video: typeof currentVideo) => {
      if (!video) return;

      const requestId = ++requestSeqRef.current;
      const isStaleRequest = () =>
        requestId !== requestSeqRef.current ||
        usePlayerStore.getState().currentVideo?.id !== video.id;

      resetState();
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
          } else if (!isStaleRequest()) {
            handlePlaybackFailure(video, result, {
              removeFailedLive: true,
              messageText: "直播播放失败，已从播放列表移除",
            });
          }
          return;
        }

        let currentCid = video.cid;
        let currentPages = video.pages;

        // 如果没有 pages 列表，或者没有 cid，我们通过 getVideoInfo 获取
        if (!currentPages || currentPages.length === 0 || !currentCid) {
          try {
            const infoRes = await apiClient.getVideoInfo(video.bvid);
            if (infoRes.data?.code === 0 && infoRes.data?.data) {
              const infoData = infoRes.data.data;
              const pagesList = infoData.pages || [];
              currentPages = pagesList;
              if (!currentCid || !pagesList.some((p: any) => p.cid === currentCid)) {
                currentCid = infoData.cid || pagesList[0]?.cid || 0;
              }

              // 同步更新 store 中的当前播放视频与 playlist，以便保存 pages
              const updatedVideo = {
                ...video,
                id: infoData.aid || video.id,
                cid: currentCid,
                pages: currentPages,
              };

              // 同步修改 ref，防止下一个 useEffect 重复触发
              lastVideoIdRef.current = updatedVideo.id;
              lastVideoCidRef.current = updatedVideo.cid;

              setCurrentVideo(updatedVideo);

              const { playlist } = usePlayerStore.getState();
              const updatedPlaylist = playlist.map((item) =>
                item.id === video.id
                  ? { ...item, id: infoData.aid || item.id, cid: currentCid, pages: currentPages }
                  : item
              );
              usePlayerStore.getState().setPlaylist(updatedPlaylist);
            }
          } catch (e) {
            console.error("后台补全视频分P信息失败", e);
          }
        }

        const playCid = currentCid || video.cid;
        const result = await apiClient.getPlayUrl(video.bvid, playCid);
        if (
          !isStaleRequest() &&
          result.code === 0 &&
          result.data?.durl?.[0]?.url
        ) {
          setVideoUrl(result.data.durl[0].url);

          try {
            const danmakuCid = result.data?.cid || playCid;
            if (!danmakuCid) {
              setDanmakuData("");
            } else {
              const danmakuRes = await apiClient.getDanmaku(danmakuCid);
              if (!isStaleRequest() && danmakuRes.code === 0) {
                setDanmakuData(danmakuRes.data);
              }
            }
          } catch (error) {
            console.error("获取弹幕失败", error);
          }
        } else if (!isStaleRequest()) {
          handlePlaybackFailure(video, result, {
            messageText: "视频播放失败，请稍后重试",
          });
        }
      } catch (error) {
        if (!isStaleRequest()) {
          handlePlaybackFailure(video, error, {
            removeFailedLive: video.duration === 0,
            messageText:
              video.duration === 0
                ? "直播播放失败，已从播放列表移除"
                : "视频播放失败，请稍后重试",
          });
        }
      } finally {
        if (requestId === requestSeqRef.current) {
          setIsLoading(false);
        }
      }
    },
    [apiClient, handlePlaybackFailure, setVideoUrl, setCurrentVideo, resetState],
  );

  useEffect(() => {
    if (!currentVideo) {
      requestSeqRef.current += 1;
      lastVideoIdRef.current = null;
      lastVideoCidRef.current = null;
      setIgnorePause(false);
      resetState();
      setIsLoading(false);
      setDanmakuData("");
      setVideoUrl(null);
      videoRef.current = null;
      return;
    }

    if (
      currentVideo.id !== lastVideoIdRef.current ||
      currentVideo.cid !== lastVideoCidRef.current
    ) {
      setIgnorePause(true);
      resetState(); // 重置去重引用，确保新视频事件能正常上报
      lastVideoIdRef.current = currentVideo.id;
      lastVideoCidRef.current = currentVideo.cid;
      setDanmakuData("");
      fetchPlayUrl(currentVideo);
    }
  }, [currentVideo, fetchPlayUrl, setVideoUrl, setIgnorePause, resetState]);

  useEffect(() => {
    if (videoRef.current) {
      const art = videoRef.current;
      if (isPlaying) {
        if (!art.playing) {
          art.play().catch((err) => {
            console.warn("自动播放失败（可能受浏览器策略限制）:", err);
            setIsPlaying(false);
            message.warning("自动播放受限，请手动点击播放");
          });
        }
      } else {
        if (art.playing) {
          art.pause();
        }
      }
    }
  }, [isPlaying, message, setIsPlaying]);



  const handlePlayVideo = (video: typeof currentVideo) => {
    if (video) {
      setIgnorePause(true);
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
    const { currentVideo: playingVideo, playlist: queue } =
      usePlayerStore.getState();

    if (!playingVideo) {
      setIsPlaying(false);
      return;
    }

    reportEnded();

    const currentIndex = queue.findIndex((video) => video.id === playingVideo.id);
    if (currentIndex === -1 || currentIndex >= queue.length - 1) {
      setIsPlaying(false);
      setIgnorePause(false);
      return;
    }

    setIgnorePause(true);
    playNext();
  }, [playNext, setIsPlaying, reportEnded, setIgnorePause]);

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentVideo) {
      toggleExpand();
    }
  };



  const handleArtInstance = useCallback(
    (art: Artplayer) => {
      videoRef.current = art;

      if (usePlayerStore.getState().isPlaying) {
        const handlePlayError = (err: any) => {
          console.warn("Artplayer 初始化自动播放失败（可能受浏览器策略限制）:", err);
          setIsPlaying(false);
          message.warning("自动播放受限，请手动点击播放");
        };

        art.play().then(() => setIsPlaying(true)).catch(handlePlayError);
        art.once("ready", () => {
          art.play().then(() => setIsPlaying(true)).catch(handlePlayError);
        });
      }


    },
    [setIsPlaying, message],
  );

  const handleArtPlay = useCallback(() => {
    const shouldUpdate = reportPlay();
    if (shouldUpdate) {
      setIsPlaying(true);
    }
  }, [setIsPlaying, reportPlay]);

  const handleArtPause = useCallback(() => {
    const shouldUpdate = reportPause();
    if (shouldUpdate) {
      setIsPlaying(false);
    }
  }, [setIsPlaying, reportPause]);

  const handleArtError = useCallback(
    (
      error: unknown,
      context: {
        mediaId?: number;
        url: string;
        isLive: boolean;
      },
    ) => {
      if (!context.isLive || !context.mediaId) {
        return;
      }

      const failedVideo = usePlayerStore
        .getState()
        .playlist.find((video) => video.id === context.mediaId);

      if (!failedVideo) {
        return;
      }

      handlePlaybackFailure(failedVideo, error, {
        removeFailedLive: true,
        messageText: "直播播放失败，已从播放列表移除",
      });
    },
    [handlePlaybackFailure],
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

        {/* 选集面板 */}
        {isExpanded && currentVideo && currentVideo.pages && currentVideo.pages.length > 1 && (
          <div className="playbar-pages-panel">
            <div className="playbar-pages-header">
              <span className="playbar-pages-title">选集 ({currentVideo.pages.length})</span>
            </div>
            <div className="playbar-pages-content">
              {currentVideo.pages.map((page) => (
                <div
                  key={page.cid}
                  className={`playbar-page-item ${currentVideo.cid === page.cid ? "active" : ""}`}
                  onClick={() => {
                    setCurrentVideo({
                      ...currentVideo,
                      cid: page.cid,
                      progress: 0,
                    });
                  }}
                  title={page.part}
                >
                  <span className="page-num">P{page.page}</span>
                  <span className="page-part" title={page.part}>{page.part}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    mediaId={currentVideo.id}
                    danmakuData={danmakuData}
                    isLive={currentVideo.duration === 0}
                    progress={currentVideo.progress}
                    isDanmakuOpen={isDanmakuOpen}
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
            color={isDanmakuOpen ? "primary" : "default"}
            variant="filled"
            onClick={() => {
              if (currentVideo) toggleDanmakuOpen();
            }}
            title={isDanmakuOpen ? "关闭弹幕" : "打开弹幕"}
            shape="circle"
          >
            <CommentOutlined />
          </Button>

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
