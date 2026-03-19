/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-11-06
 * @Description: 笔记内容展示组件（图片/视频/文本/互动数据）
 */
import React, { useRef, useEffect, useState } from "react";
import { Image, Typography, Card, Carousel, Space, Tag } from "antd";
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
} from "@ant-design/icons";
import { formatTimestamp, formatCount, parseTopicTags } from "../utils/utils";
import ImagePreviewToolbar from "./ImagePreviewToolbar";

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

  if (loading) {
    return null; // 由父组件显示 loader
  }

  return (
    <>
      {/* 视频展示 */}
      {videoUrl && (
        <div
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          <video
            controls
            src={videoUrl}
            style={{ display: "block", width: "100%" }}
            poster={videoPoster}
          />
        </div>
      )}

      {/* 图片展示 */}
      {!videoUrl && images.length > 0 && (
        <div
          ref={imageContainerRef}
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            margin: "12px 0",
          }}
        >
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
        <Title level={4} style={{ marginTop: 0 }}>
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
