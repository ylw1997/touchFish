import { Avatar, FloatButton, Spin, Drawer, List, message } from "antd";
import {
  HeartFilled,
  HeartOutlined,
  MessageOutlined,
  SoundOutlined,
  PlayCircleFilled,
  MutedOutlined,
  LoadingOutlined,
  CloseOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRequest } from "../hooks/useRequest";

interface VideoCardProps {
  aweme: any;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  shouldPlay?: boolean;
  playSignal?: number;
  playReason?: "active-change" | "visibility" | "restore" | "user" | "tab";
  userActivated?: boolean;
  onUserPlayRequest?: () => void;
  onUserPauseRequest?: () => void;
  onScrollToNext?: () => void;
  onScrollToPrev?: () => void;
}

export default function VideoCard({
  aweme,
  isActive,
  isMuted,
  onToggleMute,
  shouldPlay = true,
  playSignal = 0,
  playReason = "active-change",
  userActivated = false,
  onUserPlayRequest,
  onUserPauseRequest,
  onScrollToNext,
  onScrollToPrev,
}: VideoCardProps) {
  const { desc, author, video, statistics } = aweme;
  const [isPlaying, setIsPlaying] = useState(false);
  const isLiked = aweme?.user_digg === 1 || aweme?.user_digg === true;
  const likeCount = statistics?.digg_count || 0;
  const [messageApi, contextHolder] = message.useMessage();
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScrollToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onScrollToNext) {
      onScrollToNext();
      return;
    }
    if (containerRef.current && containerRef.current.nextElementSibling) {
      containerRef.current.nextElementSibling.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScrollToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onScrollToPrev) {
      onScrollToPrev();
      return;
    }
    if (containerRef.current && containerRef.current.previousElementSibling) {
      containerRef.current.previousElementSibling.scrollIntoView({ behavior: "smooth" });
    }
  };

  const { request } = useRequest();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsTotal, setCommentsTotal] = useState(0);

  const [commentsCursor, setCommentsCursor] = useState(0);
  const [commentsHasMore, setCommentsHasMore] = useState(true);
  const ignoreNextContainerClickRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const awemeId = aweme?.aweme_id || aweme?.id;
  const [playSource, setPlaySource] = useState<{
    awemeId?: string | number;
    index: number;
  }>({ awemeId, index: 0 });
  const playSeqRef = useRef(0);

  const coverUrl = video?.cover?.url_list?.[0] || "";

  // 播放地址排序：同步计算，避免 useEffect 异步导致 currentPlayUrl 先空后有效
  const playUrlList = useMemo(() => {
    const list: string[] = video?.play_addr?.url_list || [];
    const normalized = [...new Set(list)].filter(Boolean);
    return normalized.sort((a, b) => {
      const score = (url: string) => {
        if (url.includes("/aweme/v1/play/")) return 3;
        if (url.includes("douyinvod.com")) return 2;
        if (url.includes("douyin.com")) return 1;
        return 0;
      };
      return score(b) - score(a);
    });
  }, [video]);

  const effectivePlayUrlIndex =
    playSource.awemeId === awemeId ? playSource.index : 0;
  const currentPlayUrl = playUrlList[effectivePlayUrlIndex] || "";

  // ===== 核心播放逻辑 =====
  const requestPlay = useCallback((reason: string) => {
    const el = videoRef.current;
    if (!el || !currentPlayUrl || !isActive || !shouldPlay) return;

    const seq = ++playSeqRef.current;
    setIsVideoLoading(true);
    setShowPlayOverlay(false);

    const playPromise = el.play();
    if (!playPromise) {
      setIsPlaying(!el.paused);
      setIsVideoLoading(false);
      return;
    }

    playPromise
      .then(() => {
        if (seq !== playSeqRef.current) return;
        setIsPlaying(true);
        setShowPlayOverlay(false);
        setIsVideoLoading(false);
      })
      .catch((err) => {
        if (seq !== playSeqRef.current) return;
        if (err?.name === "AbortError") return;

        if (
          err?.name === "NotSupportedError" ||
          String(err?.message || "").includes("no supported source")
        ) {
          setIsPlaying(false);
          setIsVideoLoading(false);
          return;
        }

        console.warn(
          `[VideoCard] 播放被浏览器拒绝(${reason})，需要一次用户点击:`,
          err?.message || err,
        );
        setIsPlaying(false);
        setIsVideoLoading(false);
        setShowPlayOverlay(true);
      });
  }, [currentPlayUrl, isActive, shouldPlay]);

  useEffect(() => {
    if (playSource.awemeId !== awemeId) {
      setPlaySource({ awemeId, index: 0 });
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      setIsVideoLoading(false);
      setShowPlayOverlay(false);
    }
  }, [awemeId, playSource.awemeId]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (!isActive || !shouldPlay) {
      playSeqRef.current += 1;
      el.pause();
      setIsPlaying(false);
      setIsVideoLoading(false);
      setShowPlayOverlay(!shouldPlay);
      return;
    }

    if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || userActivated) {
      requestPlay(playReason);
    }
  }, [
    currentPlayUrl,
    isActive,
    playReason,
    playSignal,
    requestPlay,
    shouldPlay,
    userActivated,
  ]);

  const handleCanPlay = () => {
    setIsVideoLoading(false);
    if (isActive && shouldPlay) {
      requestPlay("canplay");
    }
  };

  const handlePlaying = () => {
    setIsPlaying(true);
    setShowPlayOverlay(false);
    setIsVideoLoading(false);
  };

  const pauseVideoByUser = () => {
    if (!videoRef.current) return;
    playSeqRef.current += 1;
    videoRef.current.pause();
    setIsPlaying(false);
    setIsVideoLoading(false);
    setShowPlayOverlay(true);
    onUserPauseRequest?.();
  };

  // 手动点击播放/暂停
  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      pauseVideoByUser();
    } else {
      onUserPlayRequest?.();
      requestPlay("user-click");
    }
  };

  // 播放失败自动切源容错
  const handleVideoError = (e: any) => {
    console.warn(
      "[VideoCard] 当前播放源出错，尝试切换备用源:",
      currentPlayUrl,
      e,
    );
    if (effectivePlayUrlIndex < playUrlList.length - 1) {
      setPlaySource({ awemeId, index: effectivePlayUrlIndex + 1 });
    } else {
      console.error("[VideoCard] 所有可用的抖音视频播放源均播放失败！");
      setIsVideoLoading(false);
      setShowPlayOverlay(true);
    }
  };

  // 格式化时间 00:00
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 监听视频时间更新
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(current);
      if (dur > 0) {
        setDuration(dur);
        setProgress((current / dur) * 100);
      }
    }
  };

  // 进度条点击与鼠标拖拽跳转
  const handleProgressMouseDown = (
    mouseDownEvent: React.MouseEvent<HTMLDivElement>,
  ) => {
    mouseDownEvent.stopPropagation();
    mouseDownEvent.preventDefault();
    if (!videoRef.current || !progressRef.current) return;

    const dur = videoRef.current.duration;
    if (!(dur > 0)) return;

    const updateProgress = (clientX: number) => {
      if (!progressRef.current || !videoRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const width = rect.width;
      if (width > 0) {
        let clickX = clientX - rect.left;
        if (clickX < 0) clickX = 0;
        if (clickX > width) clickX = width;
        const percent = clickX / width;
        videoRef.current.currentTime = percent * dur;
        setProgress(percent * 100);
        setCurrentTime(percent * dur);
      }
    };

    updateProgress(mouseDownEvent.clientX);

    const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
      updateProgress(mouseMoveEvent.clientX);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const formatCount = (count: number) => {
    if (!count) return "0";
    if (count > 10000) {
      return (count / 10000).toFixed(1) + "w";
    }
    return count.toString();
  };

  const closeComments = (event?: React.MouseEvent | React.KeyboardEvent) => {
    event?.stopPropagation();
    ignoreNextContainerClickRef.current = true;
    setIsCommentsOpen(false);
    window.setTimeout(() => {
      ignoreNextContainerClickRef.current = false;
    }, 0);
  };

  const fetchComments = async (isRefresh = false) => {
    if (commentsLoading || (!isRefresh && !commentsHasMore)) return;
    setCommentsLoading(true);
    try {
      const cursor = isRefresh ? 0 : commentsCursor;
      console.log(
        `[fetchComments] 开始请求数据: awemeId=${aweme?.aweme_id || aweme?.id}, cursor=${cursor}, isRefresh=${isRefresh}`,
      );

      const res = await request("DY_GET_COMMENTS", {
        aweme_id: aweme?.aweme_id || aweme?.id,
        cursor,
      });
      console.log("[fetchComments] 收到响应 res:", res);

      if (res && res.status_code === 0) {
        const list = res.comments || [];
        if (isRefresh) {
          setCommentsList(list);
        } else {
          setCommentsList((prev) => [...prev, ...list]);
        }
        setCommentsCursor(res.cursor || 0);
        setCommentsHasMore(res.has_more === 1 || res.has_more === true);
        setCommentsTotal(res.total || 0);
      } else {
        console.warn(
          "[fetchComments] 请求失败或状态码异常, res_status:",
          res?.status_code,
        );
      }
    } catch (err) {
      console.error("[fetchComments] 异常:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleOpenComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    pauseVideoByUser();
    ignoreNextContainerClickRef.current = true;
    setIsCommentsOpen(true);
    if (commentsList.length === 0) {
      fetchComments(true);
    }
  };

  const handleContainerClick = () => {
    if (ignoreNextContainerClickRef.current || isCommentsOpen) {
      ignoreNextContainerClickRef.current = false;
      return;
    }
    handlePlayToggle();
  };

  return (
    <div className="dy-video-item" ref={containerRef} onClick={handleContainerClick}>
      {contextHolder}
      {/* 视频播放器 */}
      <video
        ref={videoRef}
        src={currentPlayUrl}
        onError={handleVideoError}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setIsVideoLoading(true)}
        onPlaying={handlePlaying}
        onCanPlay={handleCanPlay}
        onSeeked={() => setIsVideoLoading(false)}
        onSeeking={() => setIsVideoLoading(true)}
        onLoadStart={() => setIsVideoLoading(true)}
        onLoadedData={() => setIsVideoLoading(false)}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
        className="video-player"
        loop
        muted={isMuted}
        playsInline
        poster={coverUrl}
        {...({ referrerPolicy: "no-referrer" } as any)}
      />

      {/* 播放进度条容器 */}
      <div className="progress-container" onClick={(e) => e.stopPropagation()}>
        <span className="time-text">{formatTime(currentTime)}</span>
        <div
          ref={progressRef}
          className="video-progress-bar"
          onMouseDown={handleProgressMouseDown}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="time-text">{formatTime(duration)}</span>
      </div>

      {/* 缓冲时垫底的封面（解决黑屏闪烁，优化卡顿感知） */}
      {isVideoLoading && coverUrl && (
        <img
          src={coverUrl}
          alt="loading cover"
          className="video-loading-cover"
          referrerPolicy="no-referrer"
        />
      )}

      {/* 加载中的 Loading 蒙版 */}
      {isVideoLoading && (
        <div className="video-loading-overlay">
          <Spin
            indicator={
              <LoadingOutlined
                style={{ fontSize: 36, color: "#fe2c55" }}
                spin
              />
            }
          />
          <span
            className="loading-text"
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            视频缓冲中...
          </span>
        </div>
      )}

      {/* 播放/暂停状态悬浮提示 */}
      {!isPlaying && showPlayOverlay && (
        <div className="play-pause-overlay">
          <PlayCircleFilled
            style={{
              fontSize: "64px",
              color: "rgba(255,255,255,0.7)",
              filter: "drop-shadow(0px 1px 4px rgba(0,0,0,0.5))",
            }}
          />
        </div>
      )}

      {/* 左下角信息区 */}
      <div className="bottom-info">
        <div className="author-name">@{author?.nickname || "未知作者"}</div>
        <div className="video-desc">{desc || "无描述"}</div>
      </div>

      {/* 右侧浮动控制条 */}
      <div className="side-actions">
        {/* 作者头像 */}
        <div
          className="action-item"
          style={{ marginBottom: "10px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <FloatButton
            className="avatar-float-btn"
            style={{ position: "static", overflow: "hidden" }}
            icon={
              <Avatar
                src={author?.avatar_thumb?.url_list?.[0]}
                style={{ border: "2px solid #fff" }}
              />
            }
          />
        </div>

        {/* 红心点赞 */}
        <div className="action-item">
          <FloatButton
            style={{ position: "static" }}
            icon={
              isLiked ? (
                <HeartFilled style={{ color: "#fe2c55" }} />
              ) : (
                <HeartOutlined />
              )
            }
            onClick={(e) => {
              e.stopPropagation();
              messageApi.info("暂不支持");
            }}
          />
          <span className="action-count">{formatCount(likeCount)}</span>
        </div>

        {/* 评论数 */}
        <div className="action-item">
          <FloatButton
            style={{ position: "static" }}
            icon={<MessageOutlined />}
            onClick={handleOpenComments}
          />
          <span className="action-count">
            {formatCount(statistics?.comment_count)}
          </span>
        </div>

        {/* 声音静音/解除静音控制 */}
        <div className="action-item">
          <FloatButton
            style={{ position: "static" }}
            icon={
              isMuted ? (
                <MutedOutlined style={{ color: "#fe2c55" }} />
              ) : (
                <SoundOutlined />
              )
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
          />
          <span className="action-count">{isMuted ? "静音" : "有声"}</span>
        </div>

        {/* 上一个视频 */}
        <div className="action-item" style={{ marginTop: "10px", marginBottom: "10px" }}>
          <FloatButton
            style={{ position: "static" }}
            icon={<UpOutlined />}
            onClick={handleScrollToPrev}
          />
          <span className="action-count">上一个</span>
        </div>

        {/* 下一个视频 */}
        <div className="action-item">
          <FloatButton
            style={{ position: "static" }}
            icon={<DownOutlined />}
            onClick={handleScrollToNext}
          />
          <span className="action-count">下一个</span>
        </div>
      </div>

      {/* 底部向上弹出的评论抽屉 */}
      <Drawer
        title={
          <div
            style={{
              color: "#fff",
              fontSize: "14px",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            {commentsTotal > 0
              ? `${formatCount(commentsTotal)} 条评论`
              : "暂无评论"}
          </div>
        }
        placement="bottom"
        onClose={closeComments}
        open={isCommentsOpen}
        height="70%"
        className="dy-comment-drawer"
        closeIcon={
          <CloseOutlined style={{ color: "rgba(255, 255, 255, 0.85)" }} />
        }
        styles={{
          header: {
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "14px 16px",
            background: "transparent",
          },
          body: {
            padding: "0 16px",
            overflowY: "auto",
            background: "transparent",
          },
          content: {
            background: "rgba(18, 18, 18, 0.7)",
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "16px 16px 0 0",
            transform: "translate3d(0, 0, 0)",
            willChange: "transform",
          },
          mask: {
            background: "rgba(0, 0, 0, 0.45)",
          },
        }}
        rootClassName="dy-comment-drawer-root"
        rootStyle={{ pointerEvents: isCommentsOpen ? "auto" : "none" }}
        destroyOnClose={false}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            paddingBottom: "24px",
          }}
        >
          {commentsList.length === 0 && !commentsLoading ? (
            <div
              style={{
                padding: "40px 0",
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.45)",
              }}
            >
              还没有人评论，快来抢沙发吧！
            </div>
          ) : (
            <>
              <List
                dataSource={commentsList}
                renderItem={(comment) => (
                  <List.Item
                    key={comment.cid}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                      padding: "12px 0",
                      alignItems: "flex-start",
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={comment.user?.avatar_thumb?.url_list?.[0]}
                          size={32}
                        />
                      }
                      title={
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              color: "rgba(255, 255, 255, 0.5)",
                              fontSize: "12px",
                              fontWeight: "normal",
                            }}
                          >
                            {comment.user?.nickname || "未知用户"}
                          </span>
                        </div>
                      }
                      description={
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            marginTop: "2px",
                          }}
                        >
                          <span
                            style={{
                              color: "#fff",
                              fontSize: "13px",
                              lineHeight: "1.4",
                              wordBreak: "break-all",
                            }}
                          >
                            {comment.text}
                          </span>
                          <span
                            style={{
                              color: "rgba(255, 255, 255, 0.3)",
                              fontSize: "10px",
                            }}
                          >
                            {new Date(
                              comment.create_time * 1000,
                            ).toLocaleDateString()}
                          </span>

                          {/* 渲染子评论回复 */}
                          {comment.reply_comment &&
                            comment.reply_comment.length > 0 && (
                              <div
                                style={{
                                  marginTop: "8px",
                                  padding: "10px 10px 10px 12px",
                                  backgroundColor: "rgba(255, 255, 255, 0.025)",
                                  borderRadius: "8px",
                                  borderLeft:
                                    "2px solid rgba(254, 44, 85, 0.55)",
                                }}
                              >
                                <List
                                  size="small"
                                  split={false}
                                  dataSource={comment.reply_comment}
                                  renderItem={(reply: any) => (
                                    <div
                                      key={reply.cid}
                                      style={{
                                        display: "flex",
                                        gap: "8px",
                                        marginBottom:
                                          reply ===
                                          comment.reply_comment[
                                            comment.reply_comment.length - 1
                                          ]
                                            ? 0
                                            : "10px",
                                        alignItems: "flex-start",
                                      }}
                                    >
                                      <Avatar
                                        src={
                                          reply.user?.avatar_thumb
                                            ?.url_list?.[0]
                                        }
                                        size={20}
                                      />
                                      <div
                                        style={{
                                          flex: 1,
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "1px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color:
                                                "rgba(255, 255, 255, 0.45)",
                                              fontSize: "11px",
                                            }}
                                          >
                                            {reply.user?.nickname || "未知用户"}
                                          </span>
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              color: "rgba(255, 255, 255, 0.3)",
                                              fontSize: "10px",
                                              gap: "2px",
                                            }}
                                          >
                                            <HeartOutlined
                                              style={{ fontSize: "10px" }}
                                            />
                                            <span>
                                              {reply.digg_count > 0
                                                ? formatCount(reply.digg_count)
                                                : ""}
                                            </span>
                                          </div>
                                        </div>
                                        <span
                                          style={{
                                            color: "rgba(255, 255, 255, 0.85)",
                                            fontSize: "12px",
                                            lineHeight: "1.4",
                                            wordBreak: "break-all",
                                          }}
                                        >
                                          {reply.text}
                                        </span>
                                        <span
                                          style={{
                                            color: "rgba(255, 255, 255, 0.22)",
                                            fontSize: "9px",
                                          }}
                                        >
                                          {new Date(
                                            reply.create_time * 1000,
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                />

                                {/* 如果还有更多子评论，显示统计提示 */}
                                {comment.reply_comment_total >
                                  comment.reply_comment.length && (
                                  <div
                                    style={{
                                      fontSize: "10.5px",
                                      color: "rgba(255, 255, 255, 0.32)",
                                      marginTop: "6px",
                                      paddingLeft: "28px",
                                    }}
                                  >
                                    共 {comment.reply_comment_total} 条回复
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      }
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        color: "rgba(255, 255, 255, 0.4)",
                        fontSize: "11px",
                        gap: "2px",
                        marginLeft: "12px",
                        flexShrink: 0,
                      }}
                    >
                      <HeartOutlined style={{ fontSize: "13px" }} />
                      <span>
                        {comment.digg_count > 0
                          ? formatCount(comment.digg_count)
                          : ""}
                      </span>
                    </div>
                  </List.Item>
                )}
              />

              {/* 加载更多按钮或状态提示 */}
              {commentsLoading ? (
                <div style={{ padding: "16px 0", textAlign: "center" }}>
                  <Spin
                    size="small"
                    tip="加载中..."
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  />
                </div>
              ) : commentsHasMore ? (
                <div style={{ padding: "16px 0", textAlign: "center" }}>
                  <span
                    onClick={() => fetchComments(false)}
                    style={{
                      color: "#fe2c55",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      padding: "6px 16px",
                      borderRadius: "16px",
                      border: "1px solid rgba(254, 44, 85, 0.3)",
                      backgroundColor: "rgba(254, 44, 85, 0.05)",
                      display: "inline-block",
                    }}
                  >
                    点击加载更多评论
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    padding: "20px 0",
                    textAlign: "center",
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  没有更多评论了
                </div>
              )}
            </>
          )}
        </div>
      </Drawer>
    </div>
  );
}
