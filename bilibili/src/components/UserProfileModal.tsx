/*
 * @Description: 用户主页抽屉组件
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Drawer, Spin, Empty, Divider, Card, Tag, Space, Button } from "antd";
import { motion } from "framer-motion";
import InfiniteScroll from "react-infinite-scroll-component";
import type {
  BilibiliOwner,
  BilibiliUserVideosResponse,
  BilibiliUserCardResponse,
  UserVideoArchive,
  BilibiliListItem,
} from "../types/bilibili";
import VideoCard from "./VideoCard";

export interface UserProfileDrawerProps {
  open: boolean;
  user: BilibiliOwner | null;
  onClose: () => void;
  onGetUserVideos: (
    mid: number,
    page: number
  ) => Promise<BilibiliUserVideosResponse>;
  onGetUserCard: (mid: number) => Promise<BilibiliUserCardResponse>;
  onModifyRelation: (
    fid: number,
    act: 1 | 2
  ) => Promise<{ code: number; message: string }>;
  onAddToWatchLater?: (bvid: string) => void;
  onGetPlayUrl?: (bvid: string, cid: number) => Promise<any>;
  onGetLivePlayUrl?: (roomId: number) => Promise<any>;
  onGetDanmaku?: (cid: number) => Promise<any>;
}

// 格式化数字
const formatCount = (count: number): string => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + "万";
  }
  return count.toString();
};

// 将用户视频项转换为VideoCard需要的格式
const convertToListItem = (
  archive: UserVideoArchive,
  owner: BilibiliOwner
): BilibiliListItem => ({
  id: archive.aid,
  bvid: archive.bvid,
  cid: 0,
  uri: `https://www.bilibili.com/video/${archive.bvid}`,
  pic: archive.pic,
  title: archive.title,
  duration: archive.duration,
  pubdate: archive.pubdate,
  owner: owner,
  stat: {
    view: archive.stat.view,
    like: 0,
    danmaku: 0,
  },
  is_followed: 0,
});

// 用户卡片信息类型
interface UserCardData {
  name: string;
  face: string;
  sign: string;
  fans: number;
  archive_count: number;
  like_num: number;
  following: boolean;
  level: number;
  official_title?: string;
}

const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({
  open,
  user,
  onClose,
  onGetUserVideos,
  onGetUserCard,
  onModifyRelation,
  onAddToWatchLater,
  onGetPlayUrl,
  onGetLivePlayUrl,
  onGetDanmaku,
}) => {
  const [videos, setVideos] = useState<BilibiliListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<string>("");

  // 用户卡片信息
  const [userCard, setUserCard] = useState<UserCardData | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // 加载用户卡片信息
  const loadUserCard = useCallback(
    async (mid: number) => {
      setCardLoading(true);
      try {
        const result = await onGetUserCard(mid);
        if (result.code === 0 && result.data) {
          setUserCard({
            name: result.data.card.name,
            face: result.data.card.face,
            sign: result.data.card.sign || "这个人很懒，什么都没写~",
            fans: result.data.follower,
            archive_count: result.data.archive_count,
            like_num: result.data.like_num,
            following: result.data.following,
            level: result.data.card.level_info?.current_level || 0,
            official_title: result.data.card.Official?.title,
          });
        }
      } finally {
        setCardLoading(false);
      }
    },
    [onGetUserCard]
  );

  // 加载视频列表
  const loadVideos = useCallback(
    async (pageNum: number, replace = false) => {
      if (!user) return;

      setLoading(true);
      try {
        const result = await onGetUserVideos(user.mid, pageNum);
        if (result.code === 0 && result.data) {
          const newVideos = (result.data.archives || []).map((archive) =>
            convertToListItem(archive, user)
          );
          setVideos((prev) => (replace ? newVideos : [...prev, ...newVideos]));
          setHasMore(pageNum * result.data.page.size < result.data.page.total);
          setPage(pageNum);
        }
      } finally {
        setLoading(false);
      }
    },
    [user, onGetUserVideos]
  );

  // 关注/取消关注
  const handleFollow = async () => {
    if (!user || followLoading || !userCard) return;

    setFollowLoading(true);
    try {
      // 如果已关注(following=true)，则act=2(取消关注)
      // 如果未关注(following=false)，则act=1(关注)
      const act = userCard.following ? 2 : 1;
      const res = await onModifyRelation(user.mid, act);

      if (res.code === 0) {
        // 更新本地状态
        setUserCard((prev) =>
          prev
            ? {
                ...prev,
                following: act === 1,
                fans: act === 1 ? prev.fans + 1 : prev.fans - 1,
              }
            : null
        );
      }
    } finally {
      setFollowLoading(false);
    }
  };

  // 用户变化时重新加载
  useEffect(() => {
    if (open && user) {
      scrollRef.current = `userVideoScroll_${user.mid}`;
      setVideos([]);
      setUserCard(null);
      setPage(1);
      setHasMore(true);
      loadUserCard(user.mid);
      loadVideos(1, true);
    }
  }, [open, user, loadVideos, loadUserCard]);

  // 关闭时清空
  const handleClose = useCallback(() => {
    onClose();
    setVideos([]);
    setUserCard(null);
    setPage(1);
    setHasMore(true);
  }, [onClose]);

  // 加载更多
  const loadMore = () => {
    if (!loading && hasMore) {
      loadVideos(page + 1);
    }
  };

  return (
    <Drawer
      getContainer={false}
      title={user?.name}
      placement="bottom"
      height="85vh"
      open={open}
      onClose={handleClose}
      destroyOnHidden
      styles={{
        wrapper: {
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          overflow: "hidden",
        },
        body: {
          padding: 0,
          overflow: "hidden",
        },
      }}
    >
      <div
        id={scrollRef.current}
        style={{
          height: "calc(85vh - 60px)",
          overflow: "auto",
          padding: "10px 5px",
        }}
      >
        {/* 用户信息卡片 - 不固定，跟随滚动 */}
        {cardLoading ? (
          <div style={{ textAlign: "center", padding: 30 }}>
            <Spin />
          </div>
        ) : (
          userCard && (
            <Card
              size="small"
              style={{ marginBottom: 12 }}
              styles={{ body: { padding: 12 } }}
            >
              {/* 头像和名称行 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                <img
                  src={userCard.face}
                  alt={userCard.name}
                  referrerPolicy="no-referrer"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Space>
                      <span style={{ fontSize: 16, fontWeight: 500 }}>
                        {userCard.name}
                      </span>
                      <Tag
                        color="green"
                        style={{
                          margin: 0,
                          fontSize: 11,
                        }}
                      >
                        LV{userCard.level}
                      </Tag>
                    </Space>

                    {userCard.following ? (
                      <Button
                        color="default"
                        variant="filled"
                        loading={followLoading}
                        onClick={handleFollow}
                      >
                        已关注
                      </Button>
                    ) : (
                      <Button
                        color="pink"
                        variant="filled"
                        loading={followLoading}
                        onClick={handleFollow}
                      >
                        关注
                      </Button>
                    )}
                  </div>
                  {userCard.official_title && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#00a1d6",
                        marginTop: 2,
                      }}
                    >
                      {userCard.official_title}
                    </div>
                  )}
                </div>
              </div>

              {/* 简介 */}
              <div
                style={{
                  fontSize: 13,
                  color: "var(--vscode-descriptionForeground)",
                  lineHeight: 1.5,
                  marginBottom: 10,
                }}
              >
                {userCard.sign}
              </div>

              {/* 统计数据 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  borderTop: "1px solid var(--vscode-widget-border)",
                  paddingTop: 12,
                  marginTop: 4,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {formatCount(userCard.fans)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--vscode-descriptionForeground)",
                    }}
                  >
                    粉丝
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {userCard.archive_count}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--vscode-descriptionForeground)",
                    }}
                  >
                    视频
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {formatCount(userCard.like_num)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--vscode-descriptionForeground)",
                    }}
                  >
                    获赞
                  </div>
                </div>
              </div>
            </Card>
          )
        )}

        {/* 视频列表 */}
        {loading && videos.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : videos.length === 0 && !cardLoading ? (
          <Empty description="暂无视频" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div id={scrollRef.current}>
            <InfiniteScroll
              dataLength={videos.length}
              next={loadMore}
              hasMore={hasMore}
              loader={
                <div style={{ textAlign: "center", padding: 20 }}>
                  <Spin />
                </div>
              }
              endMessage={
                videos.length > 0 && <Divider plain>没有了🤐</Divider>
              }
              scrollableTarget={scrollRef.current}
              scrollThreshold={0.9}
            >
              <div className="video-grid">
                {videos.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3 }}
                  >
                    <VideoCard
                      item={item}
                      onAddToWatchLater={onAddToWatchLater}
                      onGetPlayUrl={onGetPlayUrl}
                      onGetLivePlayUrl={onGetLivePlayUrl}
                      onGetDanmaku={onGetDanmaku}
                    />
                  </motion.div>
                ))}
              </div>
            </InfiniteScroll>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default UserProfileDrawer;
