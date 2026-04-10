import { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Dropdown,
  FloatButton,
  message,
  Modal,
  Space,
  Spin,
  Tabs,
  type TabsProps,
} from "antd";
import {
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  MinusOutlined,
  PlusOutlined,
  SearchOutlined,
  TrophyOutlined,
  UserOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import { AnimatePresence, motion } from "framer-motion";

import LoginModal from "./components/LoginModal";
import PlayBar from "./components/PlayBar";
import PlaylistDrawer from "./components/PlaylistDrawer";
import SearchDrawer from "./components/SearchDrawer";
import { SingerDrawer } from "./components/SingerDrawer";
import SongCard from "./components/SongCard";
import PlaylistCard from "./components/PlaylistCard";

import { useXiaoyuzhou } from "./hooks/useXiaoyuzhou";
import { useRequest } from "./hooks/useRequest";
import { useFontSizeStore } from "./store/fontSize";
import { usePlayerStore } from "./store/player";
import { useUserStore } from "./store/user";

import "./style/index.less";

function App() {
  const [activeTab, setActiveTab] = useState("recommend");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [playlistDrawerOpen, setPlaylistDrawerOpen] = useState(false);

  const [discoveryList, setDiscoveryList] = useState<any[]>([]);
  const [topList, setTopList] = useState<any[]>([]);
  const [selectedTopListObj, setSelectedTopListObj] = useState<any | null>(
    null,
  );

  const { fontSize, increase, decrease } = useFontSizeStore();
  const { isLoggedIn, userInfo, logout } = useUserStore();

  const currentEpisode = usePlayerStore((state) => state.currentEpisode);
  const { getDiscovery, getTopList, getPodcastDetail, loading } =
    useXiaoyuzhou();
  const { request } = useRequest();

  // 同步登录状态
  useEffect(() => {
    const handleAuthSync = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === "XIAOYUZHOU_AUTH_SYNC" && message.payload) {
        if (message.payload.isLoggedIn && message.payload.userInfo) {
          useUserStore.getState().login(message.payload.userInfo);
        } else {
          useUserStore.getState().logout();
        }
      }
    };

    window.addEventListener("message", handleAuthSync);

    // 主动获取一次用户信息
    const syncAuth = async () => {
      try {
        const result = await request<any>("XIAOYUZHOU_GET_USER_INFO" as any, {});
        if (result.code === 0 && result.data?.isLoggedIn) {
          useUserStore.getState().login(result.data.userInfo);
        }
      } catch (err) {
        console.error("Failed to sync auth:", err);
      }
    };

    void syncAuth();

    return () => window.removeEventListener("message", handleAuthSync);
  }, [request]);

  const handleLogout = useCallback(() => {
    Modal.confirm({
      title: "确认退出",
      content: "您确定要退出小宇宙登录吗？",
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        logout();
        message.success("已退出登录");
      },
    });
  }, [logout]);

  const loadDiscovery = useCallback(async () => {
    const data = await getDiscovery();
    if (data) {
      setDiscoveryList(data);
    }
  }, [getDiscovery]);

  const loadTopList = useCallback(async () => {
    const data = await getTopList("HOT"); // 默认取最热榜当做展示单集
    if (data) {
      setTopList(data);
    }
  }, [getTopList]);

  useEffect(() => {
    void loadDiscovery();
    void loadTopList();
  }, [loadDiscovery, loadTopList]);

  const handlePlayEpisode = useCallback((episode: any) => {
    const player = usePlayerStore.getState();
    player.play(episode);
  }, []);

  const handlePodcastClick = useCallback(
    async (podcast: any) => {
      const detail = await getPodcastDetail(podcast.pid || podcast.id);
      if (detail) {
        setSelectedTopListObj(detail);
        setPlaylistDrawerOpen(true);
      } else {
        message.error("无法获取播客下内容");
      }
    },
    [getPodcastDetail],
  );

  const tabsItems: TabsProps["items"] = [
    {
      key: "recommend",
      label: "推荐",
      icon: <HomeOutlined />,
      children: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="tab-content"
        >
          <div className="section-title">
            <h2>播客推荐</h2>
          </div>
          <div className="playlist-grid">
            {discoveryList.map((item, idx) => {
              if (item.type === "PODCAST") {
                return (
                  <PlaylistCard
                    key={item.pid || idx}
                    playlist={item}
                    onClick={handlePodcastClick}
                  />
                );
              }
              return (
                <SongCard
                  key={item.eid || idx}
                  song={item}
                  isPlaying={
                    currentEpisode?.eid === item.eid &&
                    usePlayerStore.getState().isPlaying
                  }
                  isCurrent={currentEpisode?.eid === item.eid}
                  onPlay={handlePlayEpisode}
                  onAddToPlaylist={(d) =>
                    usePlayerStore.getState().addToPlaylist(d)
                  }
                />
              );
            })}
          </div>
        </motion.div>
      ),
    },
    {
      key: "rank",
      label: "排行榜单",
      icon: <TrophyOutlined />,
      children: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="rank-header">
            <h2>小宇宙热榜</h2>
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "40px",
                }}
              >
                <Spin size="large" />
              </div>
            ) : (
              <div className="song-list">
                {topList.map((ep, idx) => (
                  <SongCard
                    key={ep.eid || idx}
                    song={ep}
                    isPlaying={
                      currentEpisode?.eid === ep.eid &&
                      usePlayerStore.getState().isPlaying
                    }
                    isCurrent={currentEpisode?.eid === ep.eid}
                    onPlay={handlePlayEpisode}
                    onAddToPlaylist={(item) => {
                      usePlayerStore.getState().addToPlaylist(item);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ),
    },
    {
      key: "my",
      label: "我的宇宙",
      icon: <UserOutlined />,
      children: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="tab-content"
        >
          {isLoggedIn ? (
            <div className="my-content">
              <div className="user-header">
                {userInfo?.avatar && (
                  <Avatar
                    src={userInfo.avatar}
                    size={72}
                    style={{ border: "2px solid var(--ant-primary-color)" }}
                  />
                )}
                <div style={{ textAlign: "center" }}>
                  <h2
                    style={{
                      margin: "4px 0",
                      fontSize: "20px",
                      fontWeight: "bold",
                    }}
                  >
                    {userInfo?.nickname || "用户"}
                  </h2>
                  <p style={{ margin: 0, opacity: 0.5, fontSize: "13px" }}>
                    享受播客时光
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="login-prompt">
              <h2>请先登录</h2>
              <p>登录后可以获取完整体验</p>
              <Button
                type="primary"
                size="large"
                icon={<LoginOutlined />}
                onClick={() => setLoginModalOpen(true)}
              >
                立即登录
              </Button>
            </div>
          )}
        </motion.div>
      ),
    },
  ];

  return (
    <div className="qqmusic-app" style={{ fontSize: `${fontSize}px` }}>
      <div className="qqmusic-header">
        <h1 className="qqmusic-title">小宇宙</h1>
        <div className="qqmusic-header-actions">
          {isLoggedIn ? (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "logout",
                    icon: <LogoutOutlined />,
                    label: "退出登录",
                    onClick: handleLogout,
                  },
                ],
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: "pointer" }}>
                {userInfo?.avatar && (
                  <Avatar src={userInfo.avatar} size="small" />
                )}
                {userInfo?.nickname && (
                  <span
                    style={{ fontSize: "14px", color: "var(--text-color)" }}
                  >
                    {userInfo.nickname}
                  </span>
                )}
              </Space>
            </Dropdown>
          ) : (
            <Button
              type="text"
              icon={<LoginOutlined />}
              onClick={() => setLoginModalOpen(true)}
            >
              登录
            </Button>
          )}
        </div>
      </div>

      <div className="qqmusic-content">
        <Tabs
          activeKey={activeTab}
          items={tabsItems}
          onChange={setActiveTab}
          className="qqmusic-tabs"
        />
      </div>

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      <AnimatePresence>{currentEpisode && <PlayBar />}</AnimatePresence>

      <SearchDrawer
        open={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
      />

      <PlaylistDrawer
        open={playlistDrawerOpen}
        onClose={() => setPlaylistDrawerOpen(false)}
        playlist={selectedTopListObj}
      />

      <SingerDrawer />

      <FloatButton.Group
        shape="circle"
        style={{ insetInlineEnd: 24, bottom: currentEpisode ? 140 : 88 }}
      >
        <FloatButton
          icon={<SearchOutlined style={{ color: "#faad14" }} />}
          tooltip={{ title: "搜索" }}
          onClick={() => setSearchDrawerOpen(true)}
        />
        <FloatButton
          onClick={decrease}
          icon={<MinusOutlined style={{ color: "#52c41a" }} />}
          tooltip={{ title: "减小字体" }}
        />
        <FloatButton
          onClick={increase}
          icon={<PlusOutlined style={{ color: "#ff4d4f" }} />}
          tooltip={{ title: "增大字体" }}
        />
        <FloatButton.BackTop
          visibilityHeight={500}
          duration={1000}
          icon={<VerticalAlignTopOutlined style={{ color: "#00a1d6" }} />}
        />
      </FloatButton.Group>
    </div>
  );
}

export default App;
