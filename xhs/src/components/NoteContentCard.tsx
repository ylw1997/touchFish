/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-11-06
 * @Description: 笔记内容展示组件（图片/视频/文本/互动数据）
 */
import React, { useRef, useEffect, useState } from "react";
import { Image, Typography, Card, Carousel, Space, Tag, Spin, Button } from "antd";
import type { CarouselRef } from "antd/es/carousel";
import {
  LeftCircleOutlined,
  RightCircleOutlined,
  HeartOutlined,
  HeartFilled,
  StarOutlined,
  StarFilled,
  CommentOutlined,
  ShareAltOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  PictureOutlined,
  PlayCircleFilled,
  RedoOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { formatTimestamp, formatCount, parseTopicTags } from "../utils/utils";
import ImagePreviewToolbar from "./ImagePreviewToolbar";
import { useConfigStore } from "../store/config";

const { Title, Paragraph } = Typography;

interface NoteData {
  title: string;
  desc: string;
  images: string[];
  videoUrl?: string | null;
  videoPoster?: string;
  liked: boolean;
  likedCount: number;
  collected: boolean;
  collectedCount: number;
  commentCount: number;
  shareCount: number;
  publishTime: number;
  ipLocation: string;
}

interface NoteContentCardProps {
  /** 笔记数据 */
  noteData: NoteData;
  /** 分享回调 */
  onShare?: () => void;
  /** 是否正在加载 */
  loading?: boolean;
  /** 点赞/取消点赞操作 */
  onToggleLike?: () => void;
  /** 点赞加载状态 */
  likeLoading?: boolean;
  /** 收藏/取消收藏操作 */
  onToggleCollect?: () => void;
  /** 收藏加载状态 */
  collectLoading?: boolean;
}

/**
 * 笔记内容展示组件
 * 负责展示图片/视频、文本内容和互动数据
 */
export const NoteContentCard: React.FC<NoteContentCardProps> = ({
  noteData,
  onShare,
  loading = false,
  onToggleLike,
  likeLoading = false,
  onToggleCollect,
  collectLoading = false,
}) => {
  const { showImg } = useConfigStore();
  const [forceShow, setForceShow] = useState(false);
  const {
    title,
    desc,
    images,
    videoUrl,
    videoPoster,
    liked,
    likedCount,
    collected,
    collectedCount,
    commentCount,
    shareCount,
    publishTime,
    ipLocation,
  } = noteData;
  const carouselRef = useRef<CarouselRef>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewCurrent, setPreviewCurrent] = useState(0);

  // 监听图片区域滚轮事件
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container || images.length <= 1) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (carouselRef.current) {
        if (e.deltaY > 0) {
          carouselRef.current.next();
        } else if (e.deltaY < 0) {
          carouselRef.current.prev();
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [images.length]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null);

  // 视频 URL 切换时重置播放器状态
  useEffect(() => {
    setIsPlaying(false);
    setIsVideoBuffering(false);
    setVideoLoadError(null);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.load();
    }
  }, [videoUrl]);

  const handleTogglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      setVideoLoadError(null);
      vid.play().catch((err) => {
        console.error("视频播放失败:", err);
        setVideoLoadError(err?.message || "视频无法直接播放，请检查网络或点击重新加载");
      });
    } else {
      vid.pause();
    }
  };

  const handleRetryVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoLoadError(null);
    setIsVideoBuffering(true);
    const vid = videoRef.current;
    if (vid) {
      vid.load();
      vid.play().catch((err) => setVideoLoadError(err?.message || "重试播放失败"));
    }
  };

  return (
    <>
      {/* 视频展示 */}
      {(showImg || forceShow) && videoUrl && (
        <div
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: 12,
            backgroundColor: "#000",
            position: "relative",
            minHeight: 200,
          }}
        >
          {/* 视频标签标记 */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            <Tag color="#ff2442" icon={<VideoCameraOutlined />}>
              小红书视频
            </Tag>
          </div>

          {/* 视频元素 */}
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            src={videoUrl}
            style={{
              display: "block",
              width: "100%",
              maxHeight: "75vh",
              objectFit: "contain",
              backgroundColor: "#000",
            }}
            poster={videoPoster}
            onPlay={() => {
              setIsPlaying(true);
              setIsVideoBuffering(false);
              setVideoLoadError(null);
            }}
            onPause={() => setIsPlaying(false)}
            onWaiting={() => setIsVideoBuffering(true)}
            onPlaying={() => setIsVideoBuffering(false)}
            onError={(e) => {
              console.error("Video load error", e);
              setIsVideoBuffering(false);
              setVideoLoadError("视频加载失败，可尝试点击重试");
            }}
            {...({ referrerPolicy: "no-referrer" } as any)}
          />

          {/* 居中大播放按钮遮罩（暂停状态且无错误时显示） */}
          {!isPlaying && !videoLoadError && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.25)",
                transition: "background-color 0.2s",
                zIndex: 2,
                cursor: "pointer",
              }}
              onClick={handleTogglePlay}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0, 0, 0, 0.65)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                }}
              >
                <PlayCircleFilled style={{ fontSize: 44, color: "#fff" }} />
              </div>
            </div>
          )}

          {/* 缓冲中 Loading 提示 */}
          {isVideoBuffering && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.4)",
                zIndex: 2,
              }}
            >
              <Spin tip="缓冲中..." size="large" />
            </div>
          )}

          {/* 错误提示与重试 */}
          {videoLoadError && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.75)",
                color: "#ff4d4f",
                padding: 16,
                zIndex: 4,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ marginBottom: 12, textAlign: "center", fontSize: 14 }}>
                {videoLoadError}
              </div>
              <Button
                type="primary"
                danger
                icon={<RedoOutlined />}
                onClick={handleRetryVideo}
              >
                重新加载
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 图片展示 */}
      {(showImg || forceShow) && !videoUrl && images.length > 0 && (
        <div
          ref={imageContainerRef}
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            margin: "12px 0",
          }}
        >
          {/* ... 原有渲染逻辑不变 ... */}
          {images.length === 1 ? (
            <Image
              src={images[0]}
              alt={title}
              style={{ objectFit: "contain", width: "100%" }}
              preview={{
                toolbarRender: (
                  _,
                  {
                    transform: { scale },
                    actions: {
                      onZoomOut,
                      onZoomIn,
                      onRotateLeft,
                      onRotateRight,
                    },
                  },
                ) => (
                  <ImagePreviewToolbar
                    imageUrl={images[0]}
                    imageIndex={0}
                    fileNamePrefix={title || "note"}
                    scale={scale}
                    onRotateLeft={onRotateLeft}
                    onRotateRight={onRotateRight}
                    onZoomIn={onZoomIn}
                    onZoomOut={onZoomOut}
                  />
                ),
              }}
            />
          ) : (
            <>
              <Carousel
                ref={carouselRef}
                adaptiveHeight
                draggable
                dots={{ className: "xhs-carousel-dots" }}
                arrows
                prevArrow={
                  <div>
                    <LeftCircleOutlined className="xhs-carousel-arrow" />
                  </div>
                }
                nextArrow={
                  <div>
                    <RightCircleOutlined className="xhs-carousel-arrow" />
                  </div>
                }
              >
                {images.map((url: string, idx: number) => (
                  <div
                    key={idx}
                    style={{ position: "relative" }}
                    onClick={() => {
                      setPreviewCurrent(idx);
                      setPreviewVisible(true);
                    }}
                  >
                    <img
                      src={url}
                      alt={title}
                      referrerPolicy="no-referrer"
                      style={{
                        display: "block",
                        width: "100%",
                        cursor: "zoom-in",
                      }}
                    />
                  </div>
                ))}
              </Carousel>
              <div style={{ display: "none" }}>
                <Image.PreviewGroup
                  preview={{
                    visible: previewVisible,
                    current: previewCurrent,
                    onVisibleChange: (visible) => setPreviewVisible(visible),
                    onChange: (current) => setPreviewCurrent(current),
                    toolbarRender: (
                      _,
                      {
                        transform: { scale },
                        actions: {
                          onZoomOut,
                          onZoomIn,
                          onRotateLeft,
                          onRotateRight,
                        },
                        current,
                      },
                    ) => (
                      <ImagePreviewToolbar
                        imageUrl={images[current]}
                        imageIndex={current}
                        fileNamePrefix={title || "note"}
                        scale={scale}
                        onRotateLeft={onRotateLeft}
                        onRotateRight={onRotateRight}
                        onZoomIn={onZoomIn}
                        onZoomOut={onZoomOut}
                      />
                    ),
                  }}
                  items={images.map((url) => ({ src: url }))}
                />
              </div>
            </>
          )}
        </div>
      )}

      {!showImg && !forceShow && (images.length > 0 || videoUrl) && (
        <div 
          className="xhs-feed-card-placeholder" 
          style={{ margin: '12px 0' }}
          onClick={() => setForceShow(true)}
        >
          <PictureOutlined />
          <span>点击加载媒体内容</span>
        </div>
      )}

      {/* 正文内容 */}
      <Card
        actions={[
          <Space
            key="like"
            style={{
              fontSize: "calc(var(--app-font-size) + 2px)",
              cursor: likeLoading ? "not-allowed" : "pointer",
              opacity: likeLoading ? 0.6 : 1,
            }}
            onClick={() => {
              if (likeLoading) return;
              onToggleLike?.();
            }}
          >
            {liked ? (
              <HeartFilled style={{ color: "#ff4d4f" }} />
            ) : (
              <HeartOutlined />
            )}
            <span>{formatCount(likedCount)}</span>
          </Space>,
          <Space
            key="collect"
            style={{
              fontSize: "calc(var(--app-font-size) + 2px)",
              cursor: collectLoading ? "not-allowed" : "pointer",
              opacity: collectLoading ? 0.6 : 1,
            }}
            onClick={() => {
              if (collectLoading) return;
              onToggleCollect?.();
            }}
          >
            {collected ? (
              <StarFilled style={{ color: "#faad14" }} />
            ) : (
              <StarOutlined />
            )}
            <span>{formatCount(collectedCount)}</span>
          </Space>,
          <Space
            key="comment"
            style={{ fontSize: "calc(var(--app-font-size) + 2px)" }}
          >
            <CommentOutlined />
            <span>{formatCount(commentCount)}</span>
          </Space>,
          <Space
            key="share"
            style={{ fontSize: "calc(var(--app-font-size) + 2px)" }}
            onClick={onShare}
          >
            <ShareAltOutlined />
            <span>{shareCount > 0 ? formatCount(shareCount) : "分享"}</span>
          </Space>,
        ]}
      >
        <Title
          level={4}
          style={{
            marginTop: 0,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-all",
            lineHeight: 1.4,
          }}
          title={title}
        >
          {title}
        </Title>
        {desc ? (
          <>
            <Paragraph
              style={{
                whiteSpace: "pre-wrap",
                marginTop: 8,
                fontSize: "calc(var(--app-font-size) + 2px)",
                marginBottom: 8,
              }}
            >
              {parseTopicTags(desc).map((item, idx) => {
                if (item.type === "tag") {
                  return (
                    <Tag key={idx} color="blue" style={{ margin: 0 }}>
                      {item.content}
                    </Tag>
                  );
                }
                return <span key={idx}>{item.content}</span>;
              })}
            </Paragraph>

            {/* 时间和地点信息 */}
            {(publishTime > 0 || ipLocation) && (
              <Space>
                {publishTime > 0 && (
                  <span className="descriptionForeground">
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {formatTimestamp(publishTime)}
                  </span>
                )}
                {ipLocation && (
                  <span className="descriptionForeground">
                    <EnvironmentOutlined style={{ marginRight: 4 }} />
                    {ipLocation}
                  </span>
                )}
              </Space>
            )}
          </>
        ) : (
          !images.length &&
          !videoUrl && (
            <div style={{ padding: 20, textAlign: "center", color: "#999" }}>
              暂无更多内容
            </div>
          )
        )}
      </Card>
    </>
  );
};

export default NoteContentCard;
