/**
 * QQ音乐主应用
 */
import { useEffect, useState, useCallback } from "react";
import {
  Tabs,
  TabsProps,
  Button,
  FloatButton,
  message,
  Modal,
  Avatar,
  Dropdown,
  Space,
  Spin,
} from "antd";
import {
  HomeOutlined,
  TrophyOutlined,
  UserOutlined,
  PlusOutlined,
  MinusOutlined,
  LoginOutlined,
  LogoutOutlined,
  RedoOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useFontSizeStore } from "./store/fontSize";
import { useUserStore } from "./store/user";
import { usePlayerStore } from "./store/player";
import { vscode } from "./utils/vscode";
import { useQQMusic } from "./hooks/useQQMusic";
import { SearchOutlined } from "@ant-design/icons";
import LoginModal from "./components/LoginModal";
import PlaylistCard from "./components/PlaylistCard";
import SongCard from "./components/SongCard";
import PlayBar from "./components/PlayBar";
import SearchDrawer from "./components/SearchDrawer";
import PlaylistDrawer from "./components/PlaylistDrawer";
import type { Playlist, RankList, Song } from "./types/qqmusic";
import "./style/index.less";

function App() {
  const [activeTab, setActiveTab] = useState("recommend");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [playlistDrawerOpen, setPlaylistDrawerOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null,
  );
  const { fontSize, increase, decrease } = useFontSizeStore();
  const { isLoggedIn, userInfo, logout } = useUserStore();

  // 退出登录：通知后端清除凭证 + 清除前端状态 (增加确认弹窗)
  const handleLogout = useCallback(() => {
    Modal.confirm({
      title: "确认退出",
      content: "您确定要退出 QQ音乐 登录吗？",
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        vscode.postMessage({ command: "QQMUSIC_LOGOUT" });
        logout();
        message.success("已退出登录");
      },
    });
  }, [logout]);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const currentSongMid = currentSong?.mid;

  const {
    isLoading,
    getRecommendPlaylists,
    getRankLists,
    getRankDetail,
    playSong,
    getMyPlaylists,
    getMyFavorite,
  } = useQQMusic();

  const [recommendPlaylists, setRecommendPlaylists] = useState<Playlist[]>([]);
  const [rankLists, setRankLists] = useState<RankList[]>([]);
  const [selectedRank, setSelectedRank] = useState<RankList | null>(null);
  const [rankSongs, setRankSongs] = useState<Song[]>([]);
  const [isRankLoading, setIsRankLoading] = useState(false);

  // 我的数据

  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([]);

  // =================== State Initialized ===================

  // 加载我的数据
  const loadMyData = useCallback(async () => {
    if (!userInfo?.musicid || !userInfo?.musickey) return;

    const credential = {
      musicid: userInfo.musicid,
      musickey: userInfo.musickey,
    };

    // 获取我的歌单
    const plResult = await getMyPlaylists(credential);
    console.log(
      "[App] getMyPlaylists Result:",
      JSON.stringify(plResult, null, 2),
    );
    if (plResult.code === 0 && plResult.data) {
      setMyPlaylists(plResult.data);
    }

    // 获取我喜欢的歌曲 MIDs
    const favResult = await getMyFavorite(credential);
    if (favResult.code === 0 && favResult.data) {
      useUserStore
        .getState()
        .setLikedSongMids(favResult.data.songs.map((s: Song) => s.mid));
    }
  }, [userInfo, getMyPlaylists, getMyFavorite]);

  // 加载推荐歌单
  const loadRecommendPlaylists = useCallback(async () => {
    console.log("[App] 开始加载推荐歌单...");
    const result = await getRecommendPlaylists(12);
    console.log("[App] 推荐歌单结果:", result);
    if (result.code === 0 && result.data) {
      console.log("[App] 设置推荐歌单:", result.data.length, "个");
      setRecommendPlaylists(result.data);
    } else {
      console.error("[App] 加载推荐歌单失败:", result.message);
    }
  }, [getRecommendPlaylists]);

  // 加载排行榜列表
  const loadRankLists = useCallback(async () => {
    console.log("[App] 开始加载排行榜...");
    const result = await getRankLists();
    console.log("[App] 排行榜结果:", result);
    if (result.code === 0 && result.data) {
      console.log("[App] 设置排行榜:", result.data.length, "个");
      setRankLists(result.data);
      if (result.data.length > 0) {
        // We defer calling loadRankDetail via an effect or avoid selectedRank dependency here,
        // but since we want to initialize:
        setSelectedRank(result.data[0]);
        // to avoid dependency cycle with selectedRank in loadRankDetail,
        // we just fetch the detail directly with the topId:
        setIsRankLoading(true);
        try {
          const detailResult = await getRankDetail(result.data[0].topId, 1, 50);
          if (detailResult.code === 0 && detailResult.data) {
            setRankSongs(detailResult.data.songs);
          }
        } finally {
          setIsRankLoading(false);
        }
      }
    } else {
      console.error("[App] 加载排行榜失败:", result.message);
    }
  }, [getRankLists, getRankDetail]);

  // 加载排行榜详情
  const loadRankDetail = useCallback(
    async (topId: number) => {
      setIsRankLoading(true);
      try {
        const result = await getRankDetail(topId, 1, 50);
        if (result.code === 0 && result.data) {
          setRankSongs(result.data.songs);
        }
      } finally {
        setIsRankLoading(false);
      }
    },
    [getRankDetail], // safe to exclude setRankSongs
  );

  // 初始化：推送凭证到后端 + 加载数据
  useEffect(() => {
    vscode.postMessage({
      command: "QQMUSIC_RESTORE_SCROLL_POSITION",
    });

    // 如果已登录，推送凭证到后端（后端重启后 globalCredential 会丢失）
    if (isLoggedIn && userInfo?.musicid && userInfo?.musickey) {
      console.log("[App] 推送已保存的凭证到后端...");
      vscode.postMessage({
        command: "QQMUSIC_SET_CREDENTIAL",
        payload: {
          musicid: userInfo.musicid,
          musickey: userInfo.musickey,
        },
      });
    }

    // 加载推荐歌单
    loadRecommendPlaylists();
    // 加载排行榜
    loadRankLists();
  }, [
    isLoggedIn,
    userInfo?.musicid,
    userInfo?.musickey,
    loadRecommendPlaylists,
    loadRankLists,
  ]);

  // 登录状态变化时刷新数据
  useEffect(() => {
    if (isLoggedIn) {
      console.log("[App] 登录成功，刷新数据...");
      // 重新加载推荐歌单和排行榜
      loadRecommendPlaylists();
      loadRankLists();
      loadMyData();
    }
  }, [isLoggedIn, loadRecommendPlaylists, loadRankLists, loadMyData]);

  // 处理歌单点击
  const handlePlaylistClick = useCallback(async (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setPlaylistDrawerOpen(true);
  }, []);

  // 处理歌曲播放
  const handlePlaySong = useCallback(
    async (song: Song) => {
      try {
        await playSong(song);
        message.success(`开始播放: ${song.name}`);
      } catch (error: any) {
        message.error(error.message || "无法播放歌曲");
      }
    },
    [playSong],
  );

  // Tab 切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // Tab 配置
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
            <h2>推荐歌单</h2>
            <Button
              type="text"
              icon={<RedoOutlined />}
              onClick={loadRecommendPlaylists}
              loading={isLoading}
            >
              刷新
            </Button>
          </div>
          <div className="playlist-grid">
            {recommendPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.dissid}
                playlist={playlist}
                onClick={handlePlaylistClick}
              />
            ))}
          </div>
        </motion.div>
      ),
    },
    {
      key: "rank",
      label: "排行榜",
      icon: <TrophyOutlined />,
      children: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="rank-header">
            <Tabs
              activeKey={selectedRank?.topId?.toString()}
              onChange={(key) => {
                const rank = rankLists.find((r) => r.topId.toString() === key);
                if (rank) {
                  setSelectedRank(rank);
                  loadRankDetail(rank.topId);
                }
              }}
              className="sub-tabs"
              items={rankLists.slice(0, 10).map((rank) => ({
                key: rank.topId.toString(),
                label: rank.title,
                children: isRankLoading ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "200px",
                    }}
                  >
                    <Spin size="large" />
                  </div>
                ) : (
                  <div className="song-list">
                    {rankSongs.map((song) => (
                      <SongCard
                        key={song.mid}
                        song={song}
                        isPlaying={currentSongMid === song.mid}
                        isCurrent={currentSongMid === song.mid}
                        onPlay={handlePlaySong}
                        onAddToPlaylist={(song) => {
                          usePlayerStore.getState().addToPlaylist(song);
                        }}
                      />
                    ))}
                  </div>
                ),
              }))}
            />
          </div>
        </motion.div>
      ),
    },
    {
      key: "my",
      label: "我的",
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
                    style={{
                      border: "2px solid var(--ant-primary-color)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
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
                  <p style={{ margin: "0", opacity: 0.5, fontSize: "13px" }}>
                    享受你的音乐时光
                  </p>
                </div>
              </div>
              <div className="my-sections">
                <div className="my-section">
                  <h3>我的歌单</h3>
                  {myPlaylists.length > 0 ? (
                    <div className="playlist-grid">
                      {myPlaylists.map((playlist) => (
                        <PlaylistCard
                          key={playlist.dissid}
                          playlist={playlist}
                          onClick={handlePlaylistClick}
                        />
                      ))}
                    </div>
                  ) : (
                    <p>暂无歌单</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="login-prompt">
              <h2>请先登录</h2>
              <p>登录后可以查看"我喜欢"和"我的歌单"</p>
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
      {/* 顶部标题栏 */}
      <div className="qqmusic-header">
        <h1 className="qqmusic-title">QQ音乐</h1>
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
              trigger={["hover"]}
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

      {/* 主内容区 */}
      <div className="qqmusic-content">
        <Tabs
          activeKey={activeTab}
          items={tabsItems}
          onChange={handleTabChange}
          className="qqmusic-tabs"
        />
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />

      {/* 播放器条 */}
      <AnimatePresence>{currentSong && <PlayBar />}</AnimatePresence>

      {/* 搜索抽屉 */}
      <SearchDrawer
        open={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
      />

      {/* 歌单详情抽屉 */}
      <PlaylistDrawer
        open={playlistDrawerOpen}
        onClose={() => setPlaylistDrawerOpen(false)}
        playlist={selectedPlaylist}
      />

      {/* 浮动按钮 */}
      <FloatButton.Group
        shape="circle"
        style={{ insetInlineEnd: 24, bottom: currentSong ? 140 : 88 }}
      >
        <FloatButton
          icon={<SearchOutlined style={{ color: "#faad14" }} />}
          tooltip={{ title: "搜索", placement: "left" }}
          onClick={() => setSearchDrawerOpen(true)}
        />
        <FloatButton
          onClick={decrease}
          icon={<MinusOutlined style={{ color: "#52c41a" }} />}
          tooltip={{ title: "减小字体", placement: "left" }}
        />
        <FloatButton
          onClick={increase}
          icon={<PlusOutlined style={{ color: "#ff4d4f" }} />}
          tooltip={{ title: "加大字体", placement: "left" }}
        />
        <FloatButton.BackTop
          visibilityHeight={500}
          duration={1000}
          icon={<VerticalAlignTopOutlined style={{ color: "#00a1d6" }} />}
          tooltip={{ title: "回到顶部", placement: "left" }}
        />
      </FloatButton.Group>
    </div>
  );
}

export default App;
