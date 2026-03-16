/**
 * QQ音乐主应用
 */
import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsProps, Button, FloatButton, message } from "antd";
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
import {
  SearchOutlined,
} from "@ant-design/icons";
import LoginModal from "./components/LoginModal";
import PlaylistCard from "./components/PlaylistCard";
import SongCard from "./components/SongCard";
import PlayBar from "./components/PlayBar";
import SearchDrawer from "./components/SearchDrawer";
import type { Playlist, RankList, Song } from "./types/qqmusic";
import "./style/index.less";

function App() {
  const [activeTab, setActiveTab] = useState("recommend");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const { fontSize, increase, decrease } = useFontSizeStore();
  const { isLoggedIn, userInfo, logout } = useUserStore();

  // 退出登录：通知后端清除凭证 + 清除前端状态
  const handleLogout = useCallback(() => {
    vscode.postMessage({ command: "QQMUSIC_LOGOUT" });
    logout();
  }, [logout]);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const currentSongMid = currentSong?.mid;

  const {
    isLoading,
    getRecommendPlaylists,
    getRankLists,
    getRankDetail,
    playSong,
    getMyFavorite,
    getMyPlaylists,
  } = useQQMusic();

  const [recommendPlaylists, setRecommendPlaylists] = useState<Playlist[]>([]);
  const [rankLists, setRankLists] = useState<RankList[]>([]);
  const [selectedRank, setSelectedRank] = useState<RankList | null>(null);
  const [rankSongs, setRankSongs] = useState<Song[]>([]);
  
  // 我的数据
  const [myFavoriteSongs, setMyFavoriteSongs] = useState<Song[]>([]);
  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([]);

  // =================== State Initialized ===================

  // 加载我的数据
  const loadMyData = useCallback(async () => {
    if (!userInfo?.musicid || !userInfo?.musickey) return;
    
    const credential = { musicid: userInfo.musicid, musickey: userInfo.musickey };
    
    // 获取我喜欢
    const favResult = await getMyFavorite(credential);
    if (favResult.code === 0 && favResult.data) {
      setMyFavoriteSongs(favResult.data.songs);
    }
    
    // 获取我的歌单
    const plResult = await getMyPlaylists(credential);
    console.log("[App] getMyPlaylists Result:", JSON.stringify(plResult, null, 2));
    if (plResult.code === 0 && plResult.data) {
      setMyPlaylists(plResult.data);
    }
  }, [userInfo, getMyFavorite, getMyPlaylists]);

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
        const detailResult = await getRankDetail(result.data[0].topId, 1, 50);
        if (detailResult.code === 0 && detailResult.data) {
          setRankSongs(detailResult.data.songs);
        }
      }
    } else {
      console.error("[App] 加载排行榜失败:", result.message);
    }
  }, [getRankLists, getRankDetail]);

  // 加载排行榜详情
  const loadRankDetail = useCallback(
    async (topId: number) => {
      const result = await getRankDetail(topId, 1, 50);
      if (result.code === 0 && result.data) {
        setRankSongs(result.data.songs);
      }
    },
    [getRankDetail] // safe to exclude setRankSongs
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
  }, [isLoggedIn, userInfo?.musicid, userInfo?.musickey, loadRecommendPlaylists, loadRankLists]);

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
  const handlePlaylistClick = useCallback(
    async (playlist: Playlist) => {
      message.info(`加载歌单: ${playlist.dissname}`);
      // TODO: 显示歌单详情
    },
    []
  );

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
    [playSong]
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
          className="tab-content"
        >
          <div className="rank-header">
            <div className="rank-tabs">
              {rankLists.slice(0, 10).map((rank) => (
                <Button
                  key={rank.topId}
                  type={selectedRank?.topId === rank.topId ? "primary" : "text"}
                  onClick={() => {
                    setSelectedRank(rank);
                    loadRankDetail(rank.topId);
                  }}
                >
                  {rank.title}
                </Button>
              ))}
            </div>
          </div>
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
                <div className="user-info">
                  <h2>欢迎回来, {userInfo?.nickname || "用户"}</h2>
                  <p>享受你的音乐时光</p>
                </div>
                <Button icon={<LogoutOutlined />} onClick={handleLogout}>
                  退出登录
                </Button>
              </div>
              <div className="my-sections">
                <div className="my-section">
                  <h3>我喜欢</h3>
                  {myFavoriteSongs.length > 0 ? (
                    <div className="song-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {myFavoriteSongs.map((song) => (
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
                  ) : (
                    <p>暂无喜欢的歌曲</p>
                  )}
                </div>
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
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
              退出
            </Button>
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
      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />

      {/* 播放器条 */}
      <AnimatePresence>{currentSong && <PlayBar />}</AnimatePresence>

      {/* 搜索抽屉 */}
      <SearchDrawer open={searchDrawerOpen} onClose={() => setSearchDrawerOpen(false)} />

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
