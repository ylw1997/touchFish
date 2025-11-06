/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 15:10:00
 * @LastEditTime: 2025-11-06 10:49:29
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\FeedDetailDrawer.tsx
 * @Description: 小红书笔记详情 Drawer，展示标题/作者/正文/图片（简单版）
 * 
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Drawer,
  Avatar,
  Image,
  Flex,
  Typography,
  Card,
  Carousel,
  List,
  Button,
  Space,
  Tag,
} from "antd";
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
  UserAddOutlined,
  UserDeleteOutlined,
  DownloadOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import { loaderFunc } from "../utils/loader";
import { createXhsApi } from "../api";
import { useRequest } from "../hooks/useRequest";
import { formatTimestamp, formatCount, parseTopicTags } from "../utils/utils";
import CommonItem from "./CommonItem";
import UserPostedDrawer from "./UserPostedDrawer";
import { INFINITE_SCROLL_CONFIG } from "../constants";
import { vscode } from "../utils/vscode";

const { Title, Paragraph } = Typography;

// ====== 类型定义 ======
interface UserDrawerPayload {
  cursor: string;
  user_id: string;
  xsec_token: string;
  user?: any;
  pc_comment?: any;
  xsec_source?: string;
}

interface FeedDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  detail: { note_id: string; xsec_token: string };
  onUserClick?: (payload: UserDrawerPayload) => void;
}

// ====== 辅助函数 ======
/**
 * 从图片对象中提取最佳质量的图片URL
 */
const extractImageUrl = (imageItem: any): string => {
  if (Array.isArray(imageItem.info_list)) {
    const dft = imageItem.info_list.find(
      (it: any) => it.image_scene === "WB_DFT" || it.image_scene === "ND_DFT"
    );
    const prv = imageItem.info_list.find(
      (it: any) => it.image_scene === "WB_PRV" || it.image_scene === "ND_PRV"
    );
    if (dft?.url) return dft.url;
    if (prv?.url) return prv.url;
  }
  return imageItem.url_default || imageItem.url_pre || imageItem.url || "";
};

/**
 * 提取视频播放URL
 */
const extractVideoUrl = (note: any): string | null => {
  const streams = note?.video?.media?.stream;
  if (!streams) return null;

  const candidates: any[] = [
    ...(Array.isArray(streams.h265) ? streams.h265 : []),
    ...(Array.isArray(streams.h264) ? streams.h264 : []),
    ...(Array.isArray(streams.h266) ? streams.h266 : []),
    ...(Array.isArray(streams.av1) ? streams.av1 : []),
  ];

  const first = candidates[0];
  if (!first) return null;

  return first.master_url || first.backup_urls?.[0] || null;
};

// 约定 detail.note 对象结构含有以下字段：title, desc, user, image_list
// 如果后端返回结构差异，可根据实际字段调整。
export const FeedDetailDrawer: React.FC<FeedDetailDrawerProps> = ({
  open,
  onClose,
  detail,
  onUserClick,
}) => {
  // ====== 基础标识 ======
  const sourceNoteId: string = detail.note_id;
  const initXsecToken: string = detail.xsec_token;

  // ====== 状态管理 ======
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [noteDetail, setNoteDetail] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentCursor, setCommentCursor] = useState<string>("");
  const [commentHasMore, setCommentHasMore] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const { request, messageApi, contextHolder } = useRequest();
  const apiRef = useRef(createXhsApi(request));
  const carouselRef = useRef<CarouselRef>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // ====== 加载详情 ======
  const fetchDetail = useCallback(async () => {
    setLoadingDetail(true);
    setNoteDetail(null);
    try {
      const data = await apiRef.current.getFeedDetail({
        source_note_id: sourceNoteId,
        xsec_token: initXsecToken,
      });
      setNoteDetail(data);
    } catch (e: any) {
      console.error("[xhs] feed detail error", e);
    } finally {
      setLoadingDetail(false);
    }
  }, [sourceNoteId, initXsecToken]);

  // ====== 加载评论 ======
  const fetchComments = useCallback(
    async (cursor: string = "") => {
      setCommentLoading(true);
      if (!cursor) {
        setComments([]);
        setCommentCursor("");
        setCommentHasMore(false);
        setCommentError(null);
      }
      try {
        const data: any = await apiRef.current.getComments({
          note_id: sourceNoteId,
          cursor,
          xsec_token: initXsecToken,
        });
        // console.log("[xhs feed detail] comments data:", data);
        setComments((prev) =>
          cursor ? [...prev, ...data.comments] : data.comments
        );
        setCommentCursor(data.cursor);
        setCommentHasMore(!!data.has_more);
      } catch (e: any) {
        setCommentError(e?.message || "评论加载失败");
      } finally {
        setCommentLoading(false);
      }
    },
    [sourceNoteId, initXsecToken]
  );

  const handleLoadMoreComments = useCallback(() => {
    fetchComments(commentCursor);
  }, [fetchComments, commentCursor]);

  // 重置状态
  const resetState = useCallback(() => {
    setNoteDetail(null);
    setComments([]);
    setCommentCursor("");
    setCommentHasMore(false);
    setCommentError(null);
  }, []);

  // ====== 生命周期：打开抽屉时加载详情与评论 ======
  useEffect(() => {
    if (open && sourceNoteId && initXsecToken) {
      fetchDetail();
    } else if (!open) {
      resetState();
    }
  }, [open, sourceNoteId, initXsecToken, fetchDetail, resetState]);

  // 当详情返回后,再加载首批评论
  useEffect(() => {
    if (noteDetail && open) {
      fetchComments("");
    }
  }, [noteDetail, open, fetchComments]);

  // 后端直接返回 items[0]，其中真实笔记在 note_card 字段；兼容老格式 detail.note 或直接的 note 对象
  const note = noteDetail?.note || noteDetail?.note_card || noteDetail;
  
  // 使用辅助函数提取图片URLs
  const images: string[] = useMemo(
    () =>
      (note?.image_list || []).map(extractImageUrl).filter(Boolean),
    [note?.image_list]
  );

  const title: string = note?.title || note?.display_title || "";
  const user = useMemo(() => note?.user || {}, [note?.user]);
  const userName: string = user?.nickname || user?.nick_name || "";
  const avatar: string = user?.avatar || "";
  const desc: string = note?.desc || "";
  
  // 提取互动信息
  const interactInfo = useMemo(() => note?.interact_info || {}, [note?.interact_info]);
  const likedCount = interactInfo?.liked_count || 0;
  const collectedCount = interactInfo?.collected_count || 0;
  const commentCount = interactInfo?.comment_count || 0;
  const shareCount = interactInfo?.share_count || 0;
  const liked = !!interactInfo?.liked;
  const collected = !!interactInfo?.collected;
  
  // 提取发布时间和地点
  const publishTime = note?.time || note?.last_update_time || 0;
  const ipLocation = note?.ip_location || "";

  // 使用辅助函数提取视频URL
  const videoUrl = useMemo(() => extractVideoUrl(note), [note]);
  const videoPoster = videoUrl && images.length === 1 ? images[0] : undefined;
  
  // 同步关注状态（从 interact_info 或 extraInfo_info 获取）
  useEffect(() => {
    if (note) {
      const followed = interactInfo?.followed || note?.extraInfo_info?.fstatus === 'follows' || note?.extraInfo_info?.fstatus === 'each_other';
      setIsFollowing(!!followed);
    }
  }, [note, interactInfo]);
  
  // 关注/取消关注功能
  const handleFollowToggle = useCallback(async () => {
    if (!user?.user_id) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await apiRef.current.unfollowUser({ target_user_id: user.user_id });
        messageApi.success('已取消关注');
        setIsFollowing(false);
      } else {
        await apiRef.current.followUser({ target_user_id: user.user_id });
        messageApi.success('关注成功');
        setIsFollowing(true);
      }
    } catch (e: any) {
      messageApi.error(e?.message || '操作失败');
    } finally {
      setFollowLoading(false);
    }
  }, [user?.user_id, isFollowing, messageApi]);
  
  // 分享功能
  const handleShare = useCallback(() => {
    if (note?.note_id) {
      const params = new URLSearchParams({
        xsec_token: initXsecToken || '',
        xsec_source: 'pc_feed'
      });
      const url = `https://www.xiaohongshu.com/explore/${note.note_id}?${params.toString()}`;
      navigator.clipboard.writeText(url).then(() => {
        messageApi.success('链接已复制到剪贴板');
      }).catch(() => {
        messageApi.error('复制失败');
      });
    }
  }, [note?.note_id, initXsecToken, messageApi]);

  // 下载图片功能
  const handleDownloadImage = useCallback(async (url: string, index: number) => {
    try {
      const fileName = `${title || 'xhs_image'}_${index + 1}.jpg`;
      
      // 通过 VSCode API 发送下载请求
      vscode.postMessage({
        command: 'XHS_DOWNLOAD_IMAGE',
        payload: {
          url,
          fileName,
        }
      });
      
      messageApi.success('已发起下载请求');
    } catch (error) {
      console.error('下载失败:', error);
      messageApi.error('下载失败');
    }
  }, [title, messageApi]);

  // ====== 内置用户主页 Drawer（当父组件未传 onUserClick 时启用） ======
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [userDrawerParams, setUserDrawerParams] = useState<UserDrawerPayload>({
    cursor: "",
    user_id: "",
    xsec_token: "",
  });

  const openUserDrawer = useCallback(
    (payload: UserDrawerPayload) => {
      if (onUserClick) {
        onUserClick(payload);
      } else {
        setUserDrawerParams(payload);
        setUserDrawerOpen(true);
      }
    },
    [onUserClick]
  );

  const closeUserDrawer = useCallback(() => setUserDrawerOpen(false), []);

  // 统一的用户点击处理
  const handleUserClick = useCallback(() => {
    if (!user?.user_id) return;
    openUserDrawer({
      cursor: sourceNoteId,
      user_id: user.user_id,
      xsec_token: initXsecToken,
      user,
    });
  }, [user, sourceNoteId, initXsecToken, openUserDrawer]);

  // 评论用户点击处理
  const handleCommentUserClick = useCallback(
    (comment: any) => {
      const rawUser = comment?.user_info;
      if (!rawUser?.user_id) return;
      
      openUserDrawer({
        cursor: "",
        user_id: rawUser.user_id,
        xsec_token: rawUser.xsec_token,
        xsec_source: "pc_comment",
        user: {
          ...rawUser,
          avatar: rawUser.avatar || rawUser.image,
          nickname: rawUser.nickname || rawUser.nick_name,
        },
      });
    },
    [openUserDrawer]
  );

  // ====== 监听图片区域滚轮事件,使用原生事件阻止页面滚动 ======
  useEffect(() => {
    const container = imageContainerRef.current;
    // 只有多图时才需要阻止滚动和切换图片
    if (!container || !open || images.length <= 1) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // 切换图片
      if (carouselRef.current) {
        if (e.deltaY > 0) {
          carouselRef.current.next();
        } else if (e.deltaY < 0) {
          carouselRef.current.prev();
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [open, images.length]);

  return (
    <>
      {contextHolder}
      <Drawer
        open={open}
        onClose={onClose}
        placement="bottom"
        destroyOnHidden
        height="90vh"
        title={title || "笔记详情"}
        styles={{
          body: {
            padding: 0,
            height: "100%",
            minHeight: 0,
            overflow: "hidden"
          },
        }}
      >
        <div 
          id="xhsFeedDetailScrollableDiv"
          style={{ 
            padding: 8, 
            height: "100%", 
            overflow: "auto" 
          }}
        >
        {/* 1) 用户信息 Card（头像小一些） */}
        <Card size="small" style={{ marginBottom: 12 }}>
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={12}>
              <Avatar
                src={avatar}
                size={40}
                style={{ cursor: user?.user_id ? "pointer" : "default" }}
                onClick={handleUserClick}
              >
                {userName?.[0]}
              </Avatar>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 18,
                  cursor: user?.user_id ? "pointer" : "default",
                }}
                onClick={handleUserClick}
              >
                {userName}
              </span>
            </Flex>
            {user?.user_id && (
              <Button
                color={isFollowing ? "default" : "primary"}
                variant="filled"
                icon={isFollowing ? <UserDeleteOutlined /> : <UserAddOutlined />}
                loading={followLoading}
                onClick={handleFollowToggle}
              >
                {isFollowing ? "取消关注" : "关注"}
              </Button>
            )}
          </Flex>
        </Card>

        {/* 2) 图片 / 视频 Carousel Card */}
        {loadingDetail && loaderFunc(3)}

        {/* 视频单独放在外层包裹 div 中 */}
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
              style={{ display: "block" }}
              poster={videoPoster || undefined}
            />
          </div>
        )}

        {/* 图片区域:单张直接展示,多张使用 Carousel + PreviewGroup */}
        {!loadingDetail && !videoUrl && images.length > 0 && (
          <div
            ref={imageContainerRef}
            style={{
              borderRadius: "12px",
              overflow: "hidden",
              margin: "12px 0",
            }}
          >
            {images.length === 1 && (
              <Image
                src={images[0]}
                alt={title}
                style={{ objectFit: "contain", width: "100%" }}
                preview={{
                  toolbarRender: (_, { transform: { scale }, actions: { onZoomOut, onZoomIn, onRotateLeft, onRotateRight } }) => (
                    <Space size={12} className="toolbar-wrapper">
                      <DownloadOutlined onClick={() => handleDownloadImage(images[0], 0)} />
                      <RotateLeftOutlined onClick={onRotateLeft} />
                      <RotateRightOutlined onClick={onRotateRight} />
                      <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
                      <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                    </Space>
                  ),
                }}
              />
            )}

            {images.length > 1 && (
              <Image.PreviewGroup
                preview={{
                  toolbarRender: (_, { transform: { scale }, actions: { onZoomOut, onZoomIn, onRotateLeft, onRotateRight }, current }) => (
                    <Space size={12} className="toolbar-wrapper">
                      <DownloadOutlined onClick={() => handleDownloadImage(images[current], current)} />
                      <RotateLeftOutlined onClick={onRotateLeft} />
                      <RotateRightOutlined onClick={onRotateRight} />
                      <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
                      <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
                    </Space>
                  ),
                }}
              >
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
                    <Image src={url} alt={title} key={idx} />
                  ))}
                </Carousel>
              </Image.PreviewGroup>
            )}
          </div>
        )}

        {/* 3) 正文 & Tag Card */}
        <Card 
          actions={[
            <Space key="like" style={{ fontSize:'16px'}} >
              {liked ? <HeartFilled style={{ color: '#ff4d4f'}} /> : <HeartOutlined />}
              <span>{formatCount(likedCount)}</span>
            </Space>,
            <Space key="collect" style={{ fontSize:'16px'}} >
              {collected ? <StarFilled style={{ color: '#faad14'}} /> : <StarOutlined />}
              <span>{formatCount(collectedCount)}</span>
            </Space>,
            <Space key="comment" style={{ fontSize:'16px'}} >
              <CommentOutlined />
              <span>{formatCount(commentCount)}</span>
            </Space>,
            <Space key="share" style={{ fontSize:'16px'}} onClick={handleShare}>
              <ShareAltOutlined />
              <span>{shareCount > 0 ? formatCount(shareCount) : '分享'}</span>
            </Space>,
          ]}
        >
          <Title level={4} style={{ marginTop: 0 }}>
            {title}
          </Title>
          {desc && (
            <>
              <Paragraph
                style={{ 
                  whiteSpace: "pre-wrap", 
                  marginTop: 8, 
                  fontSize: "16px",
                  marginBottom: 8,
                }}
              >
                {parseTopicTags(desc).map((item, idx) => {
                  if (item.type === 'tag') {
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
                  <span className="descriptionForeground">
                    {publishTime > 0 && (
                      <>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {formatTimestamp(publishTime * 1000)}
                      </>
                    )}
                  </span>
                  <span className="descriptionForeground">
                    {ipLocation && (
                      <>
                        <EnvironmentOutlined style={{ marginRight: 4 }} />
                        {ipLocation}
                      </>
                    )}
                  </span>
                </Space>
              )}
            </>
          )}
          {!loadingDetail && !images.length && !desc && !videoUrl && (
            <div style={{ padding: 20, textAlign: "center", color: "#999" }}>
              暂无更多内容
            </div>
          )}
        </Card>

        {/* 4) 评论展示 */}
        <Card
          size="small"
          title="评论"
          style={{ marginTop: 12,marginBottom: 16 }}
          styles={{
            body: {
              padding: "0",
            },
          }}
        >
          {commentLoading && !comments.length && loaderFunc(2)}
          {commentError && (
            <div style={{ color: "#ff4d4f", padding: "8px 0" }}>
              {commentError}
            </div>
          )}
          {!commentLoading && !comments.length && !commentError && (
            <div style={{ color: "#999", padding: "8px" }}>暂无评论</div>
          )}
          {!!comments.length && (
            <InfiniteScroll
              dataLength={comments.length}
              next={handleLoadMoreComments}
              hasMore={commentHasMore}
              loader={commentLoading ? loaderFunc() : null}
              endMessage={
                <div style={{ padding: 8, textAlign: "center", color: "#999" }}>
                  没有更多评论了
                </div>
              }
              scrollableTarget="xhsFeedDetailScrollableDiv"
              scrollThreshold={INFINITE_SCROLL_CONFIG.THRESHOLD}
            >
              <List
                size="small"
                dataSource={comments}
                renderItem={(comment) => (
                  <CommonItem
                    c={comment}
                    onUserClick={() => handleCommentUserClick(comment)}
                  />
                )}
              />
            </InfiniteScroll>
          )}
        </Card>
      </div>
      {/* 内置用户主页 Drawer（父组件未提供 onUserClick 时使用） */}
      {!onUserClick && (
        <UserPostedDrawer
          open={userDrawerOpen}
          onClose={closeUserDrawer}
          initParams={{
            cursor: userDrawerParams.cursor,
            user_id: userDrawerParams.user_id,
            xsec_token: userDrawerParams.xsec_token,
            user: userDrawerParams.user,
            xsec_source: userDrawerParams.xsec_source,
          }}
        />
      )}
    </Drawer>
    </>
  );
};

export default FeedDetailDrawer;
