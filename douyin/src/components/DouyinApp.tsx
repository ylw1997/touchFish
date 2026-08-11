import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Tabs, Button, Spin, Empty } from "antd";
import { SyncOutlined, CloseOutlined } from "@ant-design/icons";
import { useRequest } from "../hooks/useRequest";
import VideoCard from "./VideoCard";
import FavoriteGridCard from "./FavoriteGridCard";
import LiveGridCard from "./LiveGridCard";
import { vscode } from "../utils/vscode";

import InfiniteScroll from "react-infinite-scroll-component";

interface SavedState {
  activeTab?: string;
  list?: any[];
  activeIndex?: number;
  maxCursor?: number;
}

interface AuthorWorksState {
  author: any;
  list: any[];
  maxCursor: number;
  hasMore: boolean;
  loading: boolean;
  playIndex: number | null;
}

type PlaybackResumeReason =
  | "active-change"
  | "visibility"
  | "restore"
  | "user"
  | "tab";

const mergeUniqueAwemes = (current: any[], incoming: any[]) => {
  const seen = new Set(current.map((item) => String(item?.aweme_id || item?.id)));
  return [
    ...current,
    ...incoming.filter((item) => {
      const id = String(item?.aweme_id || item?.id || "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    }),
  ];
};

const getPreloadUrl = (aweme: any) => {
  const urls = [
    ...(aweme?.video?.play_addr_h264?.url_list || []),
    ...(aweme?.video?.play_addr?.url_list || []),
  ];
  return urls.find((url) => url.includes("/aweme/v1/play/")) || urls[0] || "";
};

export default function DouyinApp() {
  const { request, messageApi } = useRequest();

  // 从 vscode state 恢复（仅组件初始化时读一次）
  const savedStateRef = useRef((vscode.getState() as SavedState) || {});

  const [activeTab, setActiveTab] = useState(savedStateRef.current.activeTab || "recommend");
  const [list, setList] = useState<any[]>(savedStateRef.current.list || []);
  const [loading, setLoading] = useState(false);

  // 共享静音状态
  const [isMuted, setIsMuted] = useState(true);

  // 推荐流滚动及自动播放控制
  const [activeIndex, setActiveIndex] = useState(savedStateRef.current.activeIndex || 0);
  const activeIndexRef = useRef(savedStateRef.current.activeIndex || 0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 防御标志位：恢复滚动位置期间屏蔽 scroll handler
  const isRestoringRef = useRef(false);

  // 播放控制器：父级决定是否应该继续播放，VideoCard 只执行。
  const [playbackToken, setPlaybackToken] = useState(0);
  const [playbackReason, setPlaybackReason] =
    useState<PlaybackResumeReason>("active-change");
  const [shouldPlay, setShouldPlay] = useState(true);
  const userPausedRef = useRef(false);
  const userActivatedRef = useRef(false);

  // 喜欢列表分页
  const [hasMore, setHasMore] = useState(true);
  const [maxCursor, setMaxCursor] = useState(savedStateRef.current.maxCursor || 0);
  const recommendRefreshIndexRef = useRef(1);
  const recommendViewCountRef = useRef(0);
  const liveMaxTimeRef = useRef(0);
  const lastAutoPrefetchRef = useRef("");
  const [liveHasMore, setLiveHasMore] = useState(true);

  // 全屏 Overlay 播放状态
  const [overlayVideo, setOverlayVideo] = useState<any>(null);
  const [authorWorks, setAuthorWorks] = useState<AuthorWorksState | null>(null);
  const authorPlayerScrollRef = useRef<HTMLDivElement>(null);


  // ===== 状态持久化 =====
  useEffect(() => {
    vscode.setState({ activeTab, list, activeIndex, maxCursor });
  }, [activeTab, list, activeIndex, maxCursor]);

  const requestPlayback = useCallback((reason: PlaybackResumeReason) => {
    if (userPausedRef.current) return;
    setShouldPlay(true);
    setPlaybackReason(reason);
    setPlaybackToken((token) => token + 1);
  }, []);

  const pausePlayback = useCallback((isUserPause = false) => {
    if (isUserPause) {
      userPausedRef.current = true;
    }
    setShouldPlay(false);
  }, []);

  const resumeFromUserGesture = useCallback(() => {
    userActivatedRef.current = true;
    userPausedRef.current = false;
    requestPlayback("user");
  }, [requestPlayback]);

  useEffect(() => {
    const markActivated = () => {
      userActivatedRef.current = true;
    };
    window.addEventListener("pointerdown", markActivated, true);
    window.addEventListener("keydown", markActivated, true);
    window.addEventListener("wheel", markActivated, { capture: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", markActivated, true);
      window.removeEventListener("keydown", markActivated, true);
      window.removeEventListener("wheel", markActivated, true);
    };
  }, []);

  // 同步 activeIndex 到插件端 workspaceState（用于 onDidChangeVisibility 恢复）
  useEffect(() => {
    if (activeTab === "recommend" || activeTab === "following") {
      vscode.postMessage({
        command: "DY_SAVE_SCROLL_POSITION",
        payload: activeIndex,
      });
    }
  }, [activeIndex, activeTab]);

  // ===== 滚动位置恢复 =====
  const restoreScrollPosition = useCallback((targetIndex: number) => {
    isRestoringRef.current = true;
    activeIndexRef.current = targetIndex;
    setActiveIndex(targetIndex);

    // 立即设置一次
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = targetIndex * scrollContainerRef.current.clientHeight;
    }

    // 延迟二次校准（等 layout 稳定后）
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = targetIndex * scrollContainerRef.current.clientHeight;
      }
      // 再等一帧后解除防御
      requestAnimationFrame(() => {
        isRestoringRef.current = false;
      });
    });
  }, []);

  // 组件初次挂载，如果有缓存的非 0 位置则恢复
  useEffect(() => {
    if (list.length > 0 && activeIndexRef.current > 0) {
      // 等一帧让 DOM 渲染完毕再恢复滚动
      requestAnimationFrame(() => {
        restoreScrollPosition(activeIndexRef.current);
      });
    }
  }, []);

  // 监听 document.visibilitychange（VS Code 隐藏 webview 时 scrollTop 会被浏览器重置为 0）
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // 恢复滚动位置
        if (activeIndexRef.current > 0) {
          restoreScrollPosition(activeIndexRef.current);
        }
        requestPlayback("visibility");
      } else {
        pausePlayback(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [pausePlayback, requestPlayback, restoreScrollPosition]);

  // 监听 VS Code 侧的滚动恢复命令（WebviewView.onDidChangeVisibility）
  useEffect(() => {
    const handleRestoreEvent = (event: MessageEvent) => {
      if (event.data?.command === "DY_RESTORE_SCROLL_POSITION") {
        const idx = event.data.payload;
        if (typeof idx === "number" && idx >= 0) {
          restoreScrollPosition(idx);
          requestPlayback("restore");
        }
      }
    };
    window.addEventListener("message", handleRestoreEvent);
    return () => window.removeEventListener("message", handleRestoreEvent);
  }, [requestPlayback, restoreScrollPosition]);

  // ===== 数据获取 =====
  const fetchRecommendFeed = useCallback(async (isRefresh = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const refreshIndex = isRefresh ? 1 : recommendRefreshIndexRef.current;
      const viewCount = isRefresh ? 0 : recommendViewCountRef.current;
      const res = await request("DY_GET_HOME_FEED", {
        refresh_index: refreshIndex,
        view_count: viewCount,
      });
      if (res && res.status_code === 0 && Array.isArray(res.aweme_list)) {
        if (isRefresh) {
          setList(mergeUniqueAwemes([], res.aweme_list));
          setActiveIndex(0);
          activeIndexRef.current = 0;
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
          }
        } else {
          setList((prev) => mergeUniqueAwemes(prev, res.aweme_list));
        }
        recommendRefreshIndexRef.current = refreshIndex + 1;
        recommendViewCountRef.current = viewCount + res.aweme_list.length;
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

  const fetchLiveFeed = useCallback(async (isRefresh = false) => {
    if (loading || (!isRefresh && !liveHasMore)) return;
    setLoading(true);
    try {
      const maxTime = isRefresh ? 0 : liveMaxTimeRef.current;
      const [followedRes, feedRes] = await Promise.all([
        isRefresh ? request("DY_GET_FOLLOWED_LIVE") : Promise.resolve(null),
        request("DY_GET_LIVE_FEED", { max_time: maxTime }),
      ]);
      const followed = followedRes?.aweme_list || [];
      const recommended = feedRes?.aweme_list || [];
      setList((prev) => mergeUniqueAwemes(isRefresh ? [] : prev, [...followed, ...recommended]));
      liveMaxTimeRef.current = feedRes?.max_time || maxTime;
      setLiveHasMore(feedRes?.has_more === 1 || feedRes?.has_more === true);
    } catch (e: any) {
      console.error(e);
      messageApi.error(e.message || "获取直播列表失败");
      if (isRefresh) setList([]);
    } finally {
      setLoading(false);
    }
  }, [liveHasMore, loading, messageApi, request]);

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
          activeIndexRef.current = 0;
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

  // 初始化加载（仅 list 为空时请求）
  useEffect(() => {
    if (list.length === 0) {
      if (activeTab === "recommend") {
        fetchRecommendFeed(true);
      } else if (activeTab === "following") {
        fetchFollowingFeed(true);
      } else if (activeTab === "live") {
        fetchLiveFeed(true);
      } else {
        fetchFavorites(true);
      }
    }
  }, [activeTab, list.length]);

  // 提前一屏以上拉取下一页，避免滚到末尾才开始等待网络。
  useEffect(() => {
    const key = `${activeTab}:${list.length}:${activeIndex}`;
    if (lastAutoPrefetchRef.current === key) return;
    if (activeTab === "recommend" && list.length > 0 && activeIndex >= list.length - 6) {
      lastAutoPrefetchRef.current = key;
      fetchRecommendFeed();
    } else if (activeTab === "following" && list.length > 0 && activeIndex >= list.length - 4) {
      lastAutoPrefetchRef.current = key;
      fetchFollowingFeed();
    }
  }, [activeIndex, list.length, activeTab, fetchRecommendFeed, fetchFollowingFeed]);

  // 监听 VS Code 刷新事件
  useEffect(() => {
    const handleEvent = (event: MessageEvent) => {
      if (event.data?.command === "DY_FORCE_REFRESH") {
        if (activeTab === "recommend") fetchRecommendFeed(true);
        else if (activeTab === "following") fetchFollowingFeed(true);
        else if (activeTab === "live") fetchLiveFeed(true);
        else fetchFavorites(true);
      }
    };
    window.addEventListener("message", handleEvent);
    return () => window.removeEventListener("message", handleEvent);
  }, [activeTab, fetchRecommendFeed, fetchFollowingFeed, fetchFavorites, fetchLiveFeed]);

  // ===== 滚动处理 =====
  const handleRecommendScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isRestoringRef.current) return;
    const target = e.currentTarget;
    if (target.clientHeight === 0) return; // 容器不可见时跳过
    const index = Math.round(target.scrollTop / target.clientHeight);
    if (index !== activeIndex && index >= 0 && index < list.length) {
      setActiveIndex(index);
      activeIndexRef.current = index;
      requestPlayback("active-change");
    }
  };

  const scrollToIndex = useCallback((index: number) => {
    const targetIndex = Math.max(0, Math.min(index, list.length - 1));
    if (targetIndex === activeIndexRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: targetIndex * container.clientHeight,
      behavior: "smooth",
    });
    activeIndexRef.current = targetIndex;
    setActiveIndex(targetIndex);
    requestPlayback("active-change");
  }, [list.length, requestPlayback]);

  const isAuthorPlaybackOpen = authorWorks?.playIndex !== null && authorWorks?.playIndex !== undefined;
  const isExclusivePlayerOpen = Boolean(overlayVideo) || Boolean(isAuthorPlaybackOpen);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    resumeFromUserGesture();
  };

  const getAuthorSecUid = (author: any) =>
    author?.sec_uid || author?.sec_user_id || author?.secUid || "";

  const openLiveRoom = async (aweme: any) => {
    let playable = aweme;
    try {
      const rawdata = aweme?.cell_room?.rawdata;
      const room = typeof rawdata === "string" ? JSON.parse(rawdata) : rawdata;
      const webRid = room?.owner?.web_rid || room?.web_rid;
      if (webRid) {
        const response = await request("DY_GET_PLAYABLE_LIVE", { web_rid: webRid });
        playable = response?.aweme || aweme;
      }
      pausePlayback(false);
      setOverlayVideo(playable);
      resumeFromUserGesture();
    } catch (e: any) {
      messageApi.error(e.message || "直播间暂时无法播放");
    }
  };

  const fetchAuthorWorks = useCallback(async (
    author: any,
    isRefresh = false,
  ) => {
    const secUserId = getAuthorSecUid(author);
    if (!secUserId) {
      messageApi.warning("当前作者缺少作品列表 ID");
      return;
    }

    let cursor = 0;
    setAuthorWorks((prev) => {
      cursor = isRefresh ? 0 : prev?.maxCursor || 0;
      return {
        author,
        list: isRefresh ? [] : prev?.list || [],
        maxCursor: cursor,
        hasMore: true,
        loading: true,
        playIndex: prev?.playIndex ?? null,
      };
    });

    try {
      if (isRefresh) {
        void request("DY_GET_USER_PROFILE", { sec_user_id: secUserId }).then((profile) => {
          const user = profile?.user;
          if (!user) return;
          setAuthorWorks((prev) => prev && getAuthorSecUid(prev.author) === secUserId
            ? { ...prev, author: { ...prev.author, ...user } }
            : prev);
        });
      }
      const res = await request("DY_GET_USER_POSTS", {
        sec_user_id: secUserId,
        max_cursor: cursor,
      });
      if (res && res.status_code === 0 && Array.isArray(res.aweme_list)) {
        setAuthorWorks((prev) => {
          if (!prev || getAuthorSecUid(prev.author) !== secUserId) return prev;
          return {
            ...prev,
            list: isRefresh ? res.aweme_list : [...prev.list, ...res.aweme_list],
            maxCursor: res.max_cursor || res.cursor || cursor,
            hasMore: res.has_more === 1 || res.has_more === true,
            loading: false,
          };
        });
      } else {
        messageApi.error(res?.status_msg || "获取作者作品失败");
        setAuthorWorks((prev) => prev ? { ...prev, loading: false, hasMore: false } : prev);
      }
    } catch (e: any) {
      console.error(e);
      messageApi.error(e.message || "获取作者作品失败");
      setAuthorWorks((prev) => prev ? { ...prev, loading: false, hasMore: false } : prev);
    }
  }, [messageApi, request]);

  const openAuthorWorks = useCallback((author: any) => {
    pausePlayback(false);
    setAuthorWorks({
      author,
      list: [],
      maxCursor: 0,
      hasMore: true,
      loading: true,
      playIndex: null,
    });
    void fetchAuthorWorks(author, true);
  }, [fetchAuthorWorks, pausePlayback]);

  const closeAuthorWorks = useCallback(() => {
    setAuthorWorks(null);
    requestPlayback("restore");
  }, [requestPlayback]);

  const enterAuthorPlayback = (index: number) => {
    userActivatedRef.current = true;
    userPausedRef.current = false;
    setAuthorWorks((prev) => prev ? { ...prev, playIndex: index } : prev);
    requestPlayback("user");
  };

  const scrollAuthorPlaybackToIndex = useCallback((index: number) => {
    const current = authorWorks;
    if (!current) return;
    const targetIndex = Math.max(0, Math.min(index, current.list.length - 1));
    const container = authorPlayerScrollRef.current;
    const pageHeight = container?.clientHeight || 0;
    setAuthorWorks((prev) => prev ? { ...prev, playIndex: targetIndex } : prev);
    if (container && pageHeight > 0) {
      container.scrollTo({
        top: targetIndex * pageHeight,
        behavior: "smooth",
      });
    }
    requestPlayback("active-change");
  }, [authorWorks, requestPlayback]);

  const handleAuthorPlayerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const current = authorWorks;
    if (!current || current.playIndex === null) return;
    const target = e.currentTarget;
    const pageHeight = target.clientHeight;
    if (pageHeight === 0) return;
    const index = Math.round(target.scrollTop / pageHeight);
    if (index !== current.playIndex && index >= 0 && index < current.list.length) {
      setAuthorWorks({ ...current, playIndex: index });
      requestPlayback("active-change");
    }
  };

  useEffect(() => {
    if (!authorWorks || authorWorks.playIndex === null) return;
    const container = authorPlayerScrollRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      const pageHeight = container.clientHeight;
      container.scrollTop = authorWorks.playIndex! * pageHeight;
    });
  }, [authorWorks?.playIndex]);

  const activeVideo = useMemo(() => {
    if (activeTab !== "recommend" && activeTab !== "following") return null;
    return list[activeIndex] || null;
  }, [activeIndex, activeTab, list]);
  const preloadUrl = useMemo(
    () => getPreloadUrl(list[activeIndex + 1]),
    [activeIndex, list],
  );
  const [preloadedSource, setPreloadedSource] = useState({ source: "", url: "" });
  useEffect(() => {
    if (!preloadUrl) return;
    if (!preloadUrl.includes("/aweme/v1/play/")) {
      setPreloadedSource({ source: preloadUrl, url: preloadUrl });
      return;
    }
    if (preloadedSource.source === preloadUrl) return;
    let cancelled = false;
    void request("DY_RESOLVE_PLAY_URL", { url: preloadUrl })
      .then((response) => {
        if (!cancelled) setPreloadedSource({ source: preloadUrl, url: response?.url || preloadUrl });
      })
      .catch(() => {
        if (!cancelled) setPreloadedSource({ source: preloadUrl, url: preloadUrl });
      });
    return () => { cancelled = true; };
  }, [preloadUrl, preloadedSource.source, request]);
  const preloadedMediaUrl = preloadedSource.source === preloadUrl ? preloadedSource.url : "";
  const activeAuthorPlayIndex = authorWorks?.playIndex ?? null;

  return (
    <div className="dy-app-container">
      {/* 顶部 Tab 栏 (悬浮覆盖在全屏播放器上) */}
      <div className="dy-header">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setList([]);
            setActiveIndex(0);
            activeIndexRef.current = 0;
            setMaxCursor(0);
            lastAutoPrefetchRef.current = "";
            liveMaxTimeRef.current = 0;
            setLiveHasMore(true);
            setActiveTab(key);
          }}
          items={[
            { key: "recommend", label: "推荐" },
            { key: "following", label: "关注" },
            { key: "live", label: "直播" },
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
                  else if (activeTab === "live") fetchLiveFeed(true);
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
          onPointerDown={resumeFromUserGesture}
          onWheel={resumeFromUserGesture}
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
            <>
              {list.map((item, index) => {
                const coverUrl = item.video?.cover?.url_list?.[0] || "";
                const shouldRenderCover = Math.abs(index - activeIndex) <= 1;
                return (
                  <div
                    key={`${item.aweme_id || item.id}-${index}`}
                    className="dy-snap-page"
                  >
                    {shouldRenderCover && coverUrl && (
                      <img
                        src={coverUrl}
                        alt="cover"
                        className="dy-snap-cover"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                );
              })}
              {activeVideo && (
                <div
                  className="dy-active-player-layer"
                  style={{ top: `${activeIndex * 100}vh` }}
                >
                  <VideoCard
                    key="recommend-single-player"
                    aweme={activeVideo}
                    isActive={document.visibilityState !== "hidden" && !isExclusivePlayerOpen}
                    isMuted={isMuted}
                    onToggleMute={toggleMute}
                    shouldPlay={shouldPlay && !isExclusivePlayerOpen}
                    playSignal={playbackToken}
                    playReason={playbackReason}
                    userActivated={userActivatedRef.current}
                    onUserPlayRequest={resumeFromUserGesture}
                    onUserPauseRequest={() => pausePlayback(true)}
                    onScrollToNext={() => scrollToIndex(activeIndex + 1)}
                    onAuthorClick={openAuthorWorks}
                  />
                </div>
              )}
              {preloadedMediaUrl && (
                <video
                  key={preloadedMediaUrl}
                  className="dy-media-preloader"
                  src={preloadedMediaUrl}
                  muted
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                  {...({ referrerPolicy: "no-referrer" } as any)}
                />
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "live" && (
        <div id="liveScrollableDiv" className="dy-scroll-container grid-mode live-mode">
          {list.length === 0 && !loading ? (
            <div className="empty-wrapper">
              <Empty description="暂无可播放直播，请配置 Cookie 后重试" />
            </div>
          ) : (
            <InfiniteScroll
              dataLength={list.length}
              next={() => fetchLiveFeed(false)}
              hasMore={liveHasMore && !loading}
              loader={<div className="list-loading"><Spin size="small" /> 加载直播中...</div>}
              endMessage={<div className="list-end-msg">直播列表已加载完</div>}
              scrollableTarget="liveScrollableDiv"
            >
              <div className="dy-grid-container live-grid-container">
                {list.map((item, index) => (
                  <LiveGridCard
                    key={`${item.aweme_id || item.id}-${index}`}
                    aweme={item}
                    onClick={() => void openLiveRoom(item)}
                  />
                ))}
              </div>
            </InfiniteScroll>
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
            isActive={true}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            shouldPlay={true}
            playSignal={playbackToken}
            playReason="user"
            userActivated={userActivatedRef.current}
            onUserPlayRequest={resumeFromUserGesture}
            onUserPauseRequest={() => pausePlayback(true)}
            onAuthorClick={openAuthorWorks}
          />
        </div>
      )}

      {authorWorks && authorWorks.playIndex === null && (
        <div className="author-works-panel">
          <button className="close-btn" onClick={closeAuthorWorks}>
            <CloseOutlined />
          </button>
          <div className="author-works-header">
            <img
              src={authorWorks.author?.avatar_thumb?.url_list?.[0]}
              alt=""
              className="author-works-avatar"
              referrerPolicy="no-referrer"
            />
            <div className="author-works-meta">
              <div className="author-works-name">
                @{authorWorks.author?.nickname || "未知作者"}
              </div>
              <div className="author-works-count">
                {authorWorks.author?.follower_count != null
                  ? `${Number(authorWorks.author.follower_count).toLocaleString()} 粉丝 · `
                  : ""}
                {authorWorks.author?.aweme_count != null
                  ? `${authorWorks.author.aweme_count} 个作品`
                  : authorWorks.list.length > 0
                    ? `${authorWorks.list.length} 个作品`
                    : "作品"}
              </div>
            </div>
          </div>

          <div id="authorWorksScrollableDiv" className="author-works-scroll">
            {authorWorks.list.length === 0 && authorWorks.loading ? (
              <div className="author-works-loading">
                <Spin size="small" />
                <span>加载作品中...</span>
              </div>
            ) : authorWorks.list.length === 0 ? (
              <div className="empty-wrapper">
                <Empty description="暂无作品" />
              </div>
            ) : (
              <InfiniteScroll
                dataLength={authorWorks.list.length}
                next={() => fetchAuthorWorks(authorWorks.author, false)}
                hasMore={authorWorks.hasMore && !authorWorks.loading}
                loader={
                  <div className="list-loading">
                    <Spin size="small" /> 加载中...
                  </div>
                }
                endMessage={<div className="list-end-msg">没有更多作品了</div>}
                scrollableTarget="authorWorksScrollableDiv"
              >
                <div className="dy-grid-container author-grid">
                  {authorWorks.list.map((item, index) => (
                    <FavoriteGridCard
                      key={`${item.aweme_id || item.id}-${index}`}
                      aweme={item}
                      onClick={() => enterAuthorPlayback(index)}
                    />
                  ))}
                </div>
              </InfiniteScroll>
            )}
          </div>
        </div>
      )}

      {authorWorks && activeAuthorPlayIndex !== null && authorWorks.list[activeAuthorPlayIndex] && (
        <div
          className="overlay-player author-player"
          onWheel={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button className="close-btn" onClick={closeAuthorWorks}>
            <CloseOutlined />
          </button>
          <div
            ref={authorPlayerScrollRef}
            className="author-player-scroll"
            onScroll={handleAuthorPlayerScroll}
            onWheel={(e) => e.stopPropagation()}
          >
            {authorWorks.list.map((item, index) => {
              const coverUrl = item.video?.cover?.url_list?.[0] || "";
              const shouldMountPlayer = Math.abs(index - activeAuthorPlayIndex) <= 1;
              const isCurrentAuthorVideo = index === activeAuthorPlayIndex;
              if (shouldMountPlayer) {
                return (
                  <VideoCard
                    key={`${item.aweme_id || item.id}-${index}`}
                    aweme={item}
                    isActive={isCurrentAuthorVideo}
                    isMuted={isMuted}
                    onToggleMute={toggleMute}
                    shouldPlay={shouldPlay && isCurrentAuthorVideo}
                    playSignal={playbackToken}
                    playReason={playbackReason}
                    userActivated={userActivatedRef.current}
                    onUserPlayRequest={resumeFromUserGesture}
                    onUserPauseRequest={() => pausePlayback(true)}
                    onScrollToNext={() => scrollAuthorPlaybackToIndex(index + 1)}
                    onAuthorClick={openAuthorWorks}
                  />
                );
              }
              return (
                <div
                  key={`${item.aweme_id || item.id}-${index}`}
                  className="dy-video-item placeholder"
                >
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="cover"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}


    </div>
  );
}
