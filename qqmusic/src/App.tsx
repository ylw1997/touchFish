/**
 * QQ音乐主应用
 */
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
  CustomerServiceOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  MinusOutlined,
  PlusOutlined,
  RadarChartOutlined,
  ReloadOutlined,
  SearchOutlined,
  TrophyOutlined,
  UserOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import { AnimatePresence, motion } from "framer-motion";
import LoginModal from "./components/LoginModal";
import PlayBar from "./components/PlayBar";
import PlaylistCard from "./components/PlaylistCard";
import PlaylistDrawer from "./components/PlaylistDrawer";
import SearchDrawer from "./components/SearchDrawer";
import { SingerDrawer } from "./components/SingerDrawer";
import SongCard from "./components/SongCard";
import { useQQMusic } from "./hooks/useQQMusic";
import { useRequest } from "./hooks/useRequest";
import { useFontSizeStore } from "./store/fontSize";
import { usePlayerStore } from "./store/player";
import { useUserStore } from "./store/user";
import type { Playlist, RankList, Song } from "./types/qqmusic";
import { vscode } from "./utils/vscode";
import "./style/index.less";

function App() {
  const [activeTab, setActiveTab] = useState("recommend");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [playlistDrawerOpen, setPlaylistDrawerOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null,
  );
  const [recommendPlaylists, setRecommendPlaylists] = useState<Playlist[]>([]);
  const [rankLists, setRankLists] = useState<RankList[]>([]);
  const [selectedRank, setSelectedRank] = useState<RankList | null>(null);
  const [rankSongs, setRankSongs] = useState<Song[]>([]);
  const [isRankLoading, setIsRankLoading] = useState(false);
  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([]);

  const { fontSize, increase, decrease } = useFontSizeStore();
  const { isLoggedIn, userInfo, login, logout } = useUserStore();
  const { request } = useRequest();
  const currentSong = usePlayerStore((state) => state.currentSong);
  const currentSongMid = currentSong?.mid;

  const {
    getRecommendPlaylists,
    getRankLists,
    getRankDetail,
    playSong,
    getMyPlaylists,
    getMyFavorite,
    getRadarRecommend,
    getGuessRecommend,
    messageApi,
  } = useQQMusic();

  const handleLogout = useCallback(() => {
    Modal.confirm({
      title: "确认退出",
      content: "您确定要退出 QQ 音乐登录吗？",
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        vscode.postMessage({ command: "QQMUSIC_LOGOUT" });
        logout();
        message.success("已退出登录");
      },
    });
  }, [logout]);

  const loadMyData = useCallback(async () => {
    if (!userInfo?.musicid || !userInfo?.musickey) return;

    const credential = {
      musicid: userInfo.musicid,
      musickey: userInfo.musickey,
    };

    const playlistResult = await getMyPlaylists(credential);
    if (playlistResult.code === 0 && playlistResult.data) {
      setMyPlaylists(playlistResult.data);
    }

    const favoriteResult = await getMyFavorite(credential);
    if (favoriteResult.code === 0 && favoriteResult.data) {
      useUserStore
        .getState()
        .setLikedSongMids(favoriteResult.data.songs.map((song: Song) => song.mid));
    }
  }, [getMyFavorite, getMyPlaylists, userInfo]);

  const loadRecommendData = useCallback(async () => {
    const result = await getRecommendPlaylists(24);
    if (result.code === 0 && result.data) {
      setRecommendPlaylists(result.data);
    } else {
      console.error("[QQMusic] 加载推荐歌单失败:", result.message);
    }
  }, [getRecommendPlaylists]);

  const loadRankData = useCallback(async () => {
    const result = await getRankLists();
    if (result.code === 0 && result.data) {
      setRankLists(result.data);
      if (result.data.length > 0) {
        setSelectedRank(result.data[0]);
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
      console.error("[QQMusic] 加载排行榜失败:", result.message);
    }
  }, [getRankDetail, getRankLists]);

  const loadRankDetailData = useCallback(
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
    [getRankDetail],
  );

  useEffect(() => {
    const syncAuthState = async () => {
      try {
        const result = await request<any>("QQMUSIC_GET_USER_INFO", null);
        if (result.code === 0 && result.data) {
          login(result.data);
        } else {
          logout();
        }
      } catch {
        logout();
      }
    };

    void syncAuthState();

    const handleMessage = (event: MessageEvent) => {
      const payload = event.data;
      if (payload?.command !== "QQMUSIC_AUTH_SYNC") return;

      if (payload.payload?.isLoggedIn && payload.payload?.userInfo) {
        login(payload.payload.userInfo);
      } else {
        logout();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [login, logout, request]);

  useEffect(() => {
    vscode.postMessage({
      command: "QQMUSIC_RESTORE_SCROLL_POSITION",
    });

    void loadRecommendData();
    void loadRankData();
  }, [loadRankData, loadRecommendData]);

  useEffect(() => {
    if (isLoggedIn) {
      void loadRecommendData();
      void loadRankData();
      void loadMyData();
    } else {
      setMyPlaylists([]);
    }
  }, [isLoggedIn, loadMyData, loadRankData, loadRecommendData]);

  const handlePlaylistClick = useCallback(
    async (playlist: Playlist) => {
      if (playlist.dissid === 999991) {
        try {
          const res = await getRadarRecommend();
          const songs = res.data?.VecSongs
            ? res.data.VecSongs.map((item: any) => item.Track).filter(Boolean)
            : res.data?.tracks ||
              res.data?.songlist ||
              res.data?.v_song ||
              res.data?.list ||
              [];

          if (songs.length > 0) {
            const player = usePlayerStore.getState();
            player.clearPlaylist();
            player.setPlaylist(songs);
            player.setCurrentIndex(0);
            player.setIsRadioMode(false);
            player.setPlaySource("radar");
            await playSong(songs[0]);
            messageApi.success("专属雷达已开启");
          } else {
            messageApi.warning("暂无雷达推荐歌曲");
          }
        } catch {
          messageApi.error("加载专属雷达失败");
        }
        return;
      }

      if (playlist.dissid === 999992) {
        try {
          const res = await getGuessRecommend();
          const songs =
            res.data?.tracks ||
            res.data?.songlist ||
            res.data?.v_song ||
            res.data?.list ||
            [];

          if (songs.length > 0) {
            const player = usePlayerStore.getState();
            player.clearPlaylist();
            player.setPlaylist(songs);
            player.setCurrentIndex(0);
            player.setIsRadioMode(true);
            player.setPlaySource("guess");
            await playSong(songs[0]);
            messageApi.success("猜你喜欢电台已开启");
          } else {
            message.warning("暂无猜你喜欢推荐歌曲");
          }
        } catch {
          message.error("加载猜你喜欢电台失败");
        }
        return;
      }

      usePlayerStore.getState().setPlaySource("normal");
      setSelectedPlaylist(playlist);
      setPlaylistDrawerOpen(true);
    },
    [getGuessRecommend, getRadarRecommend, messageApi, playSong],
  );

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

  const handleRefresh = useCallback(async () => {
    const hide = message.loading("正在刷新数据...", 0);
    try {
      if (activeTab === "recommend") {
        await loadRecommendData();
      } else if (activeTab === "rank") {
        await loadRankData();
      } else if (activeTab === "my") {
        await loadMyData();
      }
      message.success("刷新成功");
    } catch (error: any) {
      message.error(error.message || "刷新失败");
    } finally {
      hide();
    }
  }, [activeTab, loadMyData, loadRankData, loadRecommendData]);

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
            <h2>专属推荐</h2>
          </div>
          <div
            className="special-recommend-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "14px",
              marginBottom: "24px",
            }}
          >
            <div
              className="custom-special-card"
              onClick={() =>
                handlePlaylistClick({
                  dissid: 999991,
                  dissname: "专属雷达",
                  logo: "",
                  nick: "",
                  songnum: 30,
                })
              }
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: "14px",
                padding: "12px 14px",
                cursor: "pointer",
                gap: "12px",
                transition: "all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)",
                backdropFilter: "blur(25px)",
                WebkitBackdropFilter: "blur(25px)",
              }}
            >
              <RadarChartOutlined
                style={{ fontSize: "28px", color: "#00c6ff" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  className="custom-special-title"
                  style={{ fontSize: "14px", fontWeight: "600", marginBottom: "1px" }}
                >
                  专属雷达
                </div>
                <div
                  className="custom-special-desc"
                  style={{ fontSize: "11px", letterSpacing: "0.2px" }}
                >
                  每日个性推歌
                </div>
              </div>
            </div>

            <div
              className="custom-special-card"
              onClick={() =>
                handlePlaylistClick({
                  dissid: 999992,
                  dissname: "猜你喜欢",
                  logo: "",
                  nick: "",
                  songnum: 5,
                })
              }
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: "14px",
                padding: "12px 14px",
                cursor: "pointer",
                gap: "12px",
                transition: "all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)",
                backdropFilter: "blur(25px)",
                WebkitBackdropFilter: "blur(25px)",
              }}
            >
              <CustomerServiceOutlined
                style={{ fontSize: "28px", color: "#f857a6" }}
              />
              <div style={{ flex: 1 }}>
                <div
                  className="custom-special-title"
                  style={{ fontSize: "14px", fontWeight: "600", marginBottom: "1px" }}
                >
                  猜你喜欢
                </div>
                <div
                  className="custom-special-desc"
                  style={{ fontSize: "11px", letterSpacing: "0.2px" }}
                >
                  无限流个性漫游
                </div>
              </div>
            </div>
          </div>

          <div className="section-title">
            <h2>推荐歌单</h2>
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
                const rank = rankLists.find((item) => item.topId.toString() === key);
                if (rank) {
                  setSelectedRank(rank);
                  void loadRankDetailData(rank.topId);
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
                        onAddToPlaylist={(item) => {
                          usePlayerStore.getState().addToPlaylist(item);
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
                  <p style={{ margin: 0, opacity: 0.5, fontSize: "13px" }}>
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
              <p>登录后可以查看“我喜欢”和“我的歌单”</p>
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
                {userInfo?.avatar && <Avatar src={userInfo.avatar} size="small" />}
                {userInfo?.nickname && (
                  <span style={{ fontSize: "14px", color: "var(--text-color)" }}>
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

      <AnimatePresence>{currentSong && <PlayBar />}</AnimatePresence>

      <SearchDrawer
        open={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
      />

      <PlaylistDrawer
        open={playlistDrawerOpen}
        onClose={() => setPlaylistDrawerOpen(false)}
        playlist={selectedPlaylist}
      />

      <SingerDrawer />

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
          tooltip={{ title: "增大字体", placement: "left" }}
        />
        <FloatButton.BackTop
          visibilityHeight={500}
          duration={1000}
          icon={<VerticalAlignTopOutlined style={{ color: "#00a1d6" }} />}
          tooltip={{ title: "回到顶部", placement: "left" }}
        />
        <FloatButton
          icon={<ReloadOutlined style={{ color: "#1890ff" }} />}
          tooltip={{ title: "刷新当前页", placement: "left" }}
          onClick={handleRefresh}
        />
      </FloatButton.Group>
    </div>
  );
}

export default App;
