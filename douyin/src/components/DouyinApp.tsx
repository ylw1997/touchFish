import { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, Button, Spin, Empty } from "antd";
import { SyncOutlined, CloseOutlined } from "@ant-design/icons";
import { useRequest } from "../hooks/useRequest";
import VideoCard from "./VideoCard";
import FavoriteGridCard from "./FavoriteGridCard";

import InfiniteScroll from "react-infinite-scroll-component";

export default function DouyinApp() {
  const { request, messageApi } = useRequest();
  const [activeTab, setActiveTab] = useState("recommend");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 共享静音状态 (为了防止多视频混乱，推荐默认静音，由用户手动解除)
  const [isMuted, setIsMuted] = useState(true);

  // 推荐流滚动及自动播放控制
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 喜欢列表分页
  const [hasMore, setHasMore] = useState(true);
  const [maxCursor, setMaxCursor] = useState(0);

  // 全屏 Overlay 播放状态 (喜欢列表中点击卡片后全屏播放该视频)
  const [overlayVideo, setOverlayVideo] = useState<any>(null);



  // 获取推荐视频
  const fetchRecommendFeed = useCallback(async (isRefresh = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await request("DY_GET_HOME_FEED");
      if (res && res.status_code === 0 && Array.isArray(res.aweme_list)) {
        if (isRefresh) {
          setList(res.aweme_list);
          setActiveIndex(0);
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        } else {
          setList((prev) => [...prev, ...res.aweme_list]);
        }
        setHasMore(true);
      } else {
        messageApi.error(res?.msg || "获取推荐流失败，请检查 Cookie 是否有效");
        if (isRefresh) setList([]);
      }
    } catch (e: any) {
      console.error(e);
      messageApi.error(e.message || "请求发送失败");
    } finally {
      setLoading(false);
    }
  }, [request, loading, messageApi]);

  // 获取喜欢视频列表
  const fetchFavorites = useCallback(async (isRefresh = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const cursor = isRefresh ? 0 : maxCursor;
      const res = await request("DY_GET_FAVORITES", { max_cursor: cursor });
      if (res && res.status_code === 0 && Array.isArray(res.aweme_list)) {
        if (isRefresh) {
          setList(res.aweme_list);
        } else {
          setList((prev) => [...prev, ...res.aweme_list]);
        }
        setMaxCursor(res.max_cursor || 0);
        setHasMore(res.has_more === 1 || res.has_more === true);
      } else {
        messageApi.error("获取喜欢列表失败，请先设置 Cookie");
        if (isRefresh) setList([]);
        setHasMore(false);
      }
    } catch (e: any) {
      console.error(e);
      messageApi.error(e.message || "获取喜欢列表失败");
    } finally {
      setLoading(false);
    }
  }, [request, loading, maxCursor, messageApi]);
  
  // 获取关注博主视频列表
  const fetchFollowingFeed = useCallback(async (isRefresh = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const cursor = isRefresh ? 0 : maxCursor;
      const res = await request("DY_GET_FOLLOWING", { max_cursor: cursor });
      if (res && res.status_code === 0 && Array.isArray(res.aweme_list)) {
        if (isRefresh) {
          setList(res.aweme_list);
          setActiveIndex(0);
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        } else {
          setList((prev) => [...prev, ...res.aweme_list]);
        }
        setMaxCursor(res.max_cursor || 0);
        setHasMore(res.has_more === true);
      } else {
        messageApi.error(res?.msg || "获取关注博主视频失败，请先设置 Cookie");
        if (isRefresh) setList([]);
        setHasMore(false);
      }
    } catch (e: any) {
      console.error(e);
      messageApi.error(e.message || "获取关注博主视频失败");
    } finally {
      setLoading(false);
    }
  }, [request, loading, maxCursor, messageApi]);

  // 初始化加载
  useEffect(() => {
    if (activeTab === "recommend") {
      fetchRecommendFeed(true);
    } else if (activeTab === "following") {
      fetchFollowingFeed(true);
    } else {
      fetchFavorites(true);
    }
  }, [activeTab]);

  // 推荐流/关注流中：划到倒数第2个视频时，预加载下 10 个视频，实现无缝连续滑动
  useEffect(() => {
    if (activeTab === "recommend" && list.length > 0 && activeIndex >= list.length - 2) {
      fetchRecommendFeed();
    } else if (activeTab === "following" && list.length > 0 && activeIndex >= list.length - 2) {
      fetchFollowingFeed();
    }
  }, [activeIndex, list.length, activeTab, fetchRecommendFeed, fetchFollowingFeed]);

  // 监听 VS Code 刷新事件
  useEffect(() => {
    const handleEvent = (event: MessageEvent) => {
      if (event.data?.command === "DY_FORCE_REFRESH") {
        if (activeTab === "recommend") {
          fetchRecommendFeed(true);
        } else if (activeTab === "following") {
          fetchFollowingFeed(true);
        } else {
          fetchFavorites(true);
        }
      }
    };
    window.addEventListener("message", handleEvent);
    return () => window.removeEventListener("message", handleEvent);
  }, [activeTab, fetchRecommendFeed, fetchFollowingFeed, fetchFavorites]);

  // 处理推荐页滚动事件，计算当前激活的视频序号
  const handleRecommendScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const index = Math.round(target.scrollTop / target.clientHeight);
    if (index !== activeIndex && index >= 0 && index < list.length) {
      setActiveIndex(index);
    }
  };



  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <div className="dy-app-container">
      {/* 顶部 Tab 栏 (悬浮覆盖在全屏播放器上) */}
      <div className="dy-header">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setList([]);
            setActiveTab(key);
          }}
          items={[
            { key: "recommend", label: "推荐" },
            { key: "following", label: "关注" },
            { key: "favorites", label: "我的" },
          ]}
          tabBarExtraContent={
            <div className="header-actions">
              <Button
                type="text"
                shape="circle"
                icon={<SyncOutlined style={{ color: "#fe2c55" }} />}
                onClick={() => {
                  if (activeTab === "recommend") fetchRecommendFeed(true);
                  else if (activeTab === "following") fetchFollowingFeed(true);
                  else fetchFavorites(true);
                }}
                loading={loading}
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              />
            </div>
          }
        />
      </div>

      {/* 推荐模式和关注模式下的 Snap 滚动播放器容器 */}
      {(activeTab === "recommend" || activeTab === "following") && (
        <div
          ref={scrollContainerRef}
          className="dy-scroll-container"
          onScroll={handleRecommendScroll}
        >
          {list.length === 0 && !loading ? (
            <div className="empty-wrapper">
              <Empty description="暂无视频，建议配置 Cookie 后重试">
                <Button type="primary" onClick={() => request("DY_OPEN_COOKIE_SETTING")}>
                  配置 Cookie
                </Button>
              </Empty>
            </div>
          ) : (
            list.map((item, index) => (
              <VideoCard
                key={`${item.aweme_id || item.id}-${index}`}
                aweme={item}
                isActive={index === activeIndex}
                isMuted={isMuted}
                onToggleMute={toggleMute}
              />
            ))
          )}
        </div>
      )}

      {/* 喜欢页模式下的一行两列瀑布列表 */}
      {activeTab === "favorites" && (
        <div id="gridScrollableDiv" className="dy-scroll-container grid-mode">
          {list.length === 0 && !loading ? (
            <div className="empty-wrapper">
              <Empty description="暂无喜欢视频，请先配置您的 Cookie">
                <Button type="primary" onClick={() => request("DY_OPEN_COOKIE_SETTING")}>
                  配置 Cookie
                </Button>
              </Empty>
            </div>
          ) : (
            <InfiniteScroll
              dataLength={list.length}
              next={fetchFavorites}
              hasMore={hasMore && !loading}
              loader={
                <div className="list-loading">
                  <Spin size="small" /> 加载中...
                </div>
              }
              endMessage={
                <div className="list-end-msg">没有更多视频了</div>
              }
              scrollableTarget="gridScrollableDiv"
            >
              <div className="dy-grid-container">
                {list.map((item, index) => (
                  <FavoriteGridCard
                    key={`${item.aweme_id || item.id}-${index}`}
                    aweme={item}
                    onClick={() => setOverlayVideo(item)}
                  />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </div>
      )}

      {/* 喜欢列表点击后开启的全屏 Overlay 播放层 */}
      {overlayVideo && (
        <div className="overlay-player">
          <button className="close-btn" onClick={() => setOverlayVideo(null)}>
            <CloseOutlined />
          </button>
          <VideoCard
            aweme={overlayVideo}
            isActive={true} // 悬浮播放时一直处于 active 播放状态
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />
        </div>
      )}


    </div>
  );
}
