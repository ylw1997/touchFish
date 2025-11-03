/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 15:10:00
 * @LastEditTime: 2025-11-03 15:03:18
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\FeedDetailDrawer.tsx
 * @Description: 小红书笔记详情 Drawer，展示标题/作者/正文/图片（简单版）
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
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
} from "antd";
import { loaderFunc } from "../utils/loader";
import { createXhsApi } from "../api";
import { useRequest } from "../hooks/useRequest";
import CommonItem from "./CommonItem";
import UserPostedDrawer from './UserPostedDrawer';

const { Title, Paragraph } = Typography;

interface FeedDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  // 由父组件传入的必要标识（feed 列表项）
  detail: { note_id: string; xsec_token: string };
  onUserClick?: (payload: { cursor: string; user_id: string; xsec_token: string; user?: any; pc_comment?: any; xsec_source?: string }) => void;
}

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

  const { request } = useRequest();
  const apiRef = useRef(createXhsApi(request));

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

  // ====== 生命周期：打开抽屉时加载详情与评论 ======
  useEffect(() => {
    if (open && sourceNoteId && initXsecToken) {
      fetchDetail();
    }
    if (!open) {
      // 重置状态
      setNoteDetail(null);
      setComments([]);
      setCommentCursor("");
      setCommentHasMore(false);
      setCommentError(null);
    }
  }, [open, sourceNoteId, initXsecToken, fetchDetail]);

  // 当详情返回后，再加载首批评论
  useEffect(() => {
    if (noteDetail && open) {
      fetchComments("");
    }
  }, [noteDetail, open, fetchComments]);
  // 后端直接返回 items[0]，其中真实笔记在 note_card 字段；兼容老格式 detail.note 或直接的 note 对象
  const note = noteDetail?.note || noteDetail?.note_card || noteDetail; // 容错：使用加载后的详情
  // image 对象可能包含 info_list/url_default/url_pre/url，优先使用 info_list 中的 WB_DFT/WB_PRV
  const images: string[] = (note?.image_list || [])
    .map((i: any) => {
      if (Array.isArray(i.info_list)) {
        const dft = i.info_list.find(
          (it: any) =>
            it.image_scene === "WB_DFT" || it.image_scene === "ND_DFT"
        );
        const prv = i.info_list.find(
          (it: any) =>
            it.image_scene === "WB_PRV" || it.image_scene === "ND_PRV"
        );
        if (dft?.url) return dft.url;
        if (prv?.url) return prv.url;
      }
      return i.url_default || i.url_pre || i.url || "";
    })
    .filter(Boolean);
  const title: string = note?.title || note?.display_title || "";
  const user = note?.user || {};
  const userName: string = user?.nickname || user?.nick_name || "";
  const avatar: string = user?.avatar || "";
  const desc: string = note?.desc || "";

  // try extract a playable video url from note.video
  const getFirstVideoUrl = (n: any): string | null => {
    const streams = n?.video?.media?.stream;
    if (!streams) return null;
    const candidates: any[] = [];
    if (Array.isArray(streams.h265)) candidates.push(...streams.h265);
    if (Array.isArray(streams.h264)) candidates.push(...streams.h264);
    if (Array.isArray(streams.h266)) candidates.push(...streams.h266);
    if (Array.isArray(streams.av1)) candidates.push(...streams.av1);
    const first = candidates[0] || null;
    if (!first) return null;
    return (
      first.master_url || (first.backup_urls && first.backup_urls[0]) || null
    );
  };

  const videoUrl = getFirstVideoUrl(note);
  // 计算视频封面：优先使用后端 video.image 提供的缩略图字段，否则当存在视频且只有一张图片时使用该图片
  const videoPoster = videoUrl && images.length === 1 ? images[0] : undefined;

  // ====== 内置用户主页 Drawer（当父组件未传 onUserClick 时启用） ======
  const [userDrawerOpen, setUserDrawerOpen] = useState(false);
  const [userDrawerParams, setUserDrawerParams] = useState<{ cursor: string; user_id: string; xsec_token: string; user?: any; xsec_source?: string }>({ cursor: '', user_id: '', xsec_token: '' });

  const openUserDrawer = (payload: { cursor: string; user_id: string; xsec_token: string; user?: any; xsec_source?: string }) => {
    if (onUserClick) {
      // 交给父组件处理
      onUserClick(payload);
    } else {
      setUserDrawerParams(payload);
      setUserDrawerOpen(true);
    }
  };

  const closeUserDrawer = () => setUserDrawerOpen(false);

  return (
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
          overflow: "auto",
        },
      }}
    >
      <div style={{ padding: 16 }}>
        {/* 1) 用户信息 Card（头像小一些） */}
        <Card size="small" style={{ marginBottom: 12 }}>
          <Flex align="center" gap={12} style={{ marginBottom: 0 }}>
            <Avatar
              src={avatar}
              size={40}
              style={{ cursor: user?.user_id ? 'pointer' : 'default' }}
              onClick={() => {
                if (!user?.user_id) return;
                openUserDrawer({
                  cursor: sourceNoteId,
                  user_id: user.user_id,
                  xsec_token: initXsecToken,
                  user,
                });
              }}
            >
              {userName?.[0]}
            </Avatar>
            <span
              style={{ fontWeight: 600, fontSize: 18, cursor: user?.user_id ? 'pointer' : 'default' }}
              onClick={() => {
                if (!user?.user_id) return;
                openUserDrawer({
                  cursor: sourceNoteId,
                  user_id: user.user_id,
                  xsec_token: initXsecToken,
                  user,
                });
              }}
            >{userName}</span>
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
              style={{
                display: "block",
              }}
              poster={videoPoster || undefined}
            />
          </div>
        )}

        {/* 图片区域：单张直接展示，多张使用 Carousel + PreviewGroup */}
        {!loadingDetail && !videoUrl && images.length > 0 && (
          <div
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
              />
            )}

            {images.length > 1 && (
              <Image.PreviewGroup>
                <Carousel
                  adaptiveHeight
                  draggable
                  dots={{ className: "xhs-carousel-dots" }}
                  arrows
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
        <Card size="small">
          <Title level={4} style={{ marginTop: 0 }}>
            {title}
          </Title>
          {desc && (
            <Paragraph
              style={{ whiteSpace: "pre-wrap", marginTop: 8, fontSize: "16px" }}
            >
              {desc}
            </Paragraph>
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
          style={{ marginTop: 12 }}
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
            <List
              size="small"
              dataSource={comments}
              renderItem={(comment) => (
                <CommonItem
                  c={comment}
                  onUserClick={() => {
                    const u = comment?.user_info;
                    if (!u?.user_id) return;
                    const rawUser = comment.user_info || {};
                    openUserDrawer({
                      cursor: "", // 评论上下文不需要初始 cursor
                      user_id: rawUser.user_id,
                      xsec_token: rawUser.xsec_token,
                      xsec_source: "pc_comment",
                      user: {
                        ...rawUser,
                        avatar: rawUser.avatar || rawUser.image,
                        nickname: rawUser.nickname || rawUser.nick_name,
                      },
                    });
                  }}
                />
              )}
            />
          )}
          {commentHasMore && (
            <div style={{ textAlign: "center", margin: 8 }}>
              <Button
                variant="filled"
                color="default"
                loading={commentLoading}
                onClick={handleLoadMoreComments}
              >
                {commentLoading ? "加载中..." : "加载更多"}
              </Button>
            </div>
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
  );
};

export default FeedDetailDrawer;
