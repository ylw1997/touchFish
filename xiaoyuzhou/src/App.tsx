import { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Dropdown,
  Drawer,
  Empty,
  FloatButton,
  Input,
  List,

  Segmented,
  Space,
  Spin,
  Tabs,
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
import { motion } from "framer-motion";

import LoginModal from "./components/LoginModal";
import PlaylistCard from "./components/PlaylistCard";
import SongCard from "./components/SongCard";
import { useXiaoyuzhou } from "./hooks/useXiaoyuzhou";
import { useRequest } from "./hooks/useRequest";
import { useFontSizeStore } from "./store/fontSize";
import { useUserStore } from "./store/user";

import "./style/index.less";

function App() {
  const { request } = useRequest();
  const { fontSize, increase, decrease } = useFontSizeStore();
  const { isLoggedIn, userInfo, logout, login } = useUserStore();
  const {
    loading,
    getDiscovery,
    getTopList,
    doSearch,
    getPodcastDetail,
    getEpisodeDetail,
    getSubscriptions,
  } = useXiaoyuzhou();

  const [activeTab, setActiveTab] = useState("recommend");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [discoveryList, setDiscoveryList] = useState<any[]>([]);
  const [topList, setTopList] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [topCategory, setTopCategory] = useState<"HOT" | "ROCK" | "NEW">("HOT");
  const [podcastOpen, setPodcastOpen] = useState(false);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [podcastDetail, setPodcastDetail] = useState<any | null>(null);
  const [podcastEpisodes, setPodcastEpisodes] = useState<any[]>([]);
  const [episodeOpen, setEpisodeOpen] = useState(false);
  const [episodeDetail, setEpisodeDetail] = useState<any | null>(null);

  useEffect(() => {
    const handleAuthSync = (event: MessageEvent) => {
      const payload = event.data?.payload;
      if (event.data?.command !== "XIAOYUZHOU_AUTH_SYNC" || !payload) {
        return;
      }

      if (payload.isLoggedIn && payload.userInfo) {
        login(payload.userInfo);
      } else {
        logout();
      }
    };

    window.addEventListener("message", handleAuthSync);

    const syncAuth = async () => {
      const result = await request<any>("XIAOYUZHOU_GET_USER_INFO" as any, {});
      if (result.code === 0 && result.data?.isLoggedIn && result.data?.userInfo) {
        login(result.data.userInfo);
      }
    };

    void syncAuth();

    return () => window.removeEventListener("message", handleAuthSync);
  }, [login, logout, request]);

  const loadDiscovery = useCallback(async () => {
    const data = await getDiscovery();
    setDiscoveryList(data || []);
  }, [getDiscovery]);

  const loadTopList = useCallback(
    async (category: "HOT" | "ROCK" | "NEW") => {
      const data = await getTopList(category);
      setTopList(data || []);
    },
    [getTopList],
  );

  const loadSubscriptions = useCallback(async () => {
    if (!isLoggedIn) {
      setSubscriptions([]);
      return;
    }

    const data = await getSubscriptions();
    setSubscriptions(data.map((item: any) => item?.podcast || item).filter(Boolean));
  }, [getSubscriptions, isLoggedIn]);

  useEffect(() => {
    void loadDiscovery();
  }, [loadDiscovery]);

  useEffect(() => {
    void loadTopList(topCategory);
  }, [loadTopList, topCategory]);

  useEffect(() => {
    if (activeTab === "my") {
      void loadSubscriptions();
    }
  }, [activeTab, loadSubscriptions]);

  const handleLogout = useCallback(() => {
    console.log("[xiaoyuzhou] handleLogout clicked, executing...");
    (async () => {
      try {
        const result = await request<any>("XIAOYUZHOU_LOGOUT" as any, {});
        console.log("[xiaoyuzhou] Logout request result:", result);
      } catch (e) {
        console.error("[xiaoyuzhou] Logout request failed:", e);
      } finally {
        console.log("[xiaoyuzhou] Clearing frontend state...");
        logout();
        setSubscriptions([]);
      }
    })();
  }, [logout, request]);

  const openPodcast = useCallback(
    async (podcast: any) => {
      const pid = podcast?.pid || podcast?.id;
      if (!pid) {
        return;
      }

      setPodcastOpen(true);
      setPodcastLoading(true);
      try {
        const detail = await getPodcastDetail(pid);
        setPodcastDetail(detail?.podcast || null);
        setPodcastEpisodes(detail?.episodes || []);
      } finally {
        setPodcastLoading(false);
      }
    },
    [getPodcastDetail],
  );

  const openEpisode = useCallback(
    async (episode: any) => {
      const eid = episode?.eid || episode?.id;
      if (!eid) {
        return;
      }

      const detail = await getEpisodeDetail(eid);
      if (!detail) {
        return;
      }

      setEpisodeDetail(detail);
      setEpisodeOpen(true);
    },
    [getEpisodeDetail],
  );

  const handleSearch = useCallback(async () => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }

    const data = await doSearch(searchKeyword.trim());
    setSearchResults(data || []);
  }, [doSearch, searchKeyword]);

  const renderPodcastList = (items: any[], emptyText: string) => {
    if (loading && items.length === 0) {
      return (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spin size="large" />
        </div>
      );
    }

    if (items.length === 0) {
      return <Empty description={emptyText} />;
    }

    return (
      <div className="playlist-grid">
        {items.map((item, idx) => (
          <PlaylistCard
            key={item?.pid || item?.id || idx}
            playlist={item}
            onClick={openPodcast}
          />
        ))}
      </div>
    );
  };

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
                  },
                ],
                onClick: ({ key }) => {
                  console.log("[xiaoyuzhou] Menu item clicked:", key);
                  if (key === "logout") {
                    handleLogout();
                  }
                },
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: "pointer" }}>
                {userInfo?.avatar ? <Avatar src={userInfo.avatar} size="small" /> : null}
                {userInfo?.nickname ? (
                  <span style={{ fontSize: "14px", color: "var(--vscode-foreground)" }}>
                    {userInfo.nickname}
                  </span>
                ) : null}
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
          onChange={setActiveTab}
          className="qqmusic-tabs"
          items={[
            {
              key: "recommend",
              label: "推荐",
              icon: <HomeOutlined />,
              children: (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="tab-content"
                >
                  <div className="section-title">
                    <h2>播客推荐</h2>
                  </div>
                  {renderPodcastList(discoveryList, "暂无推荐内容")}
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
                  transition={{ duration: 0.25 }}
                  className="tab-content"
                >
                  <div className="rank-header">
                    <Segmented
                      className="rank-tabs"
                      value={topCategory}
                      onChange={(value) => setTopCategory(value as "HOT" | "ROCK" | "NEW")}
                      options={[
                        { label: "最热", value: "HOT" },
                        { label: "飙升", value: "ROCK" },
                        { label: "新星", value: "NEW" },
                      ]}
                    />
                    {loading && topList.length === 0 ? (
                      <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                        <Spin size="large" />
                      </div>
                    ) : (
                      <div className="song-list">
                        {topList.map((episode, idx) => (
                          <SongCard
                            key={episode?.eid || idx}
                            song={episode}
                            onPlay={() => void openEpisode(episode)}
                            showActions={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ),
            },
            {
              key: "search",
              label: "搜索",
              icon: <SearchOutlined />,
              children: (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="tab-content"
                >
                  <Input.Search
                    placeholder="搜索播客"
                    enterButton="搜索"
                    value={searchKeyword}
                    onChange={(event) => setSearchKeyword(event.target.value)}
                    onSearch={() => void handleSearch()}
                    style={{ marginBottom: 16 }}
                  />
                  {renderPodcastList(searchResults, "输入关键词后搜索小宇宙播客")}
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
                  transition={{ duration: 0.25 }}
                  className="tab-content"
                >
                  {isLoggedIn ? (
                    <div className="my-content">
                      <div className="user-header">
                        {userInfo?.avatar ? <Avatar src={userInfo.avatar} size={72} /> : null}
                        <div style={{ textAlign: "center" }}>
                          <h2 style={{ margin: "4px 0", fontSize: "20px", fontWeight: "bold" }}>
                            {userInfo?.nickname || "用户"}
                          </h2>
                          <p style={{ margin: 0, opacity: 0.5, fontSize: "13px" }}>
                            享受播客时光
                          </p>
                        </div>
                      </div>
                      <div className="section-title">
                        <h2>我的订阅</h2>
                      </div>
                      {renderPodcastList(subscriptions, "这个账号暂时还没有已订阅的节目。")}
                    </div>
                  ) : (
                    <div className="login-prompt">
                      <h2>请先登录</h2>
                      <p>登录后可以查看我的订阅和更多内容</p>
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
          ]}
        />
      </div>

      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />

      <Drawer
        title={podcastDetail?.title || "播客详情"}
        placement="bottom"
        height="90%"
        open={podcastOpen}
        onClose={() => setPodcastOpen(false)}
      >
        {podcastLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Spin size="large" />
          </div>
        ) : (
          <List
            dataSource={podcastEpisodes}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button key="open" type="link" onClick={() => void openEpisode(item)}>
                    打开
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar src={item?.podcast?.image?.smallPicUrl || item?.image?.smallPicUrl} />}
                  title={item?.title || "未命名单集"}
                  description={item?.description || item?.brief || ""}
                />
              </List.Item>
            )}
          />
        )}
      </Drawer>

      <Drawer
        title={episodeDetail?.title || "单集详情"}
        placement="bottom"
        height="90%"
        open={episodeOpen}
        onClose={() => setEpisodeOpen(false)}
      >
        {episodeDetail ? (
          <>
            <p>{episodeDetail.description || "暂无简介"}</p>
            {episodeDetail.enclosure?.url || episodeDetail.media?.source?.url ? (
              <audio
                controls
                style={{ width: "100%", margin: "16px 0" }}
                src={episodeDetail.enclosure?.url || episodeDetail.media?.source?.url}
              />
            ) : null}
            {episodeDetail.shownotes ? (
              <div
                className="xy-html"
                dangerouslySetInnerHTML={{ __html: episodeDetail.shownotes }}
              />
            ) : null}
          </>
        ) : (
          <Empty description="暂无单集详情" />
        )}
      </Drawer>

      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24, bottom: 88 }}>
        <FloatButton
          icon={<SearchOutlined style={{ color: "#faad14" }} />}
          tooltip={{ title: "搜索" }}
          onClick={() => setActiveTab("search")}
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
