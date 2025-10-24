/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 15:10:00
 * @LastEditTime: 2025-10-24 15:11:21
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\FeedDetailDrawer.tsx
 * @Description: 小红书笔记详情 Drawer，展示标题/作者/正文/图片（简单版）
 */
import React from "react";
import { Drawer, Avatar, Image, Flex, Typography, Card, Carousel } from "antd";
import { loaderFunc } from "../utils/loader";

const { Title, Paragraph } = Typography;

interface FeedDetailDrawerProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  detail?: any; // 后端返回的笔记详情结构（暂未完整类型）
}

// 约定 detail.note 对象结构含有以下字段：title, desc, user, image_list
// 如果后端返回结构差异，可根据实际字段调整。
export const FeedDetailDrawer: React.FC<FeedDetailDrawerProps> = ({
  open,
  onClose,
  detail,
  loading,
}) => {
  // 后端直接返回 items[0]，其中真实笔记在 note_card 字段；兼容老格式 detail.note 或直接的 note 对象
  const note = detail?.note || detail?.note_card || detail; // 容错
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
  const user = note?.user || detail?.user || {};
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
            <Avatar src={avatar} size={40}>
              {userName?.[0]}
            </Avatar>
            <span style={{ fontWeight: 600, fontSize: 18 }}>{userName}</span>
          </Flex>
        </Card>

        {/* 2) 图片 / 视频 Carousel Card */}
        {loading && loaderFunc(3)}

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
        {!loading && !videoUrl && images.length > 0 && (
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
                <Carousel adaptiveHeight draggable dots={{ className: "xhs-carousel-dots" }} arrows>
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
          {!loading && !images.length && !desc && !videoUrl && (
            <div style={{ padding: 20, textAlign: "center", color: "#999" }}>
              暂无更多内容
            </div>
          )}
        </Card>
      </div>
    </Drawer>
  );
};

export default FeedDetailDrawer;
