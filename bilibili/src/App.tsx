/*
 * @Description: Bilibili 扩展主应用
 */

import { useEffect, useState, useRef } from "react";
import { Divider, FloatButton, Tabs, TabsProps } from "antd";
import { motion } from "framer-motion";
import "./style/index.less";
import {
  RedoOutlined,
  VerticalAlignTopOutlined,
  PlusOutlined,
  MinusOutlined,
  PlaySquareOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import _relativeTime from "dayjs/plugin/relativeTime";
import VideoCard from "./components/VideoCard";
import { loaderFunc } from "./utils/loader";
import { defTab, TabItem } from "./data/tabs";
import useBilibiliAction from "./hooks/useBilibiliAction";
import { usePlayerStore } from "./store/player";
import { useFavoriteTabs } from "./hooks/useFavoriteTabs";
import { vscode } from "./utils/vscode";
import { useFontSizeStore } from "./store/fontSize";
import { debounce } from "./utils";
import PlayBar from "./components/PlayBar";
import SearchDrawer from "./components/SearchDrawer";
import UserProfileDrawer from "./components/UserProfileModal";
import type { BilibiliOwner } from "./types/bilibili";

dayjs.locale("zh-cn");
dayjs.extend(_relativeTime);

function App() {
  const scrollableNodeRef = useRef<HTMLDivElement>(null);
  const [tabs] = useState<TabItem[]>(defTab);
  const { increase, decrease } = useFontSizeStore();

  // 搜索抽屉状态
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);

  // 用户主页弹窗状态
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BilibiliOwner | null>(null);

  // 业务逻辑 Hook
  const {
    list,
    total,
    copyLink,
    clearList,
    getListData,
    isFetching,
    getFavoriteFolders,
    getFavoriteDetail,
    addToWatchLater,
    delFromWatchLater,
    getPlayUrl,
    getDanmaku,
    getUserVideos,
    getUserCard,
    modifyRelation,
  } = useBilibiliAction();

  const { addListToPlaylist } = usePlayerStore();

  // 收藏夹 Tab 逻辑 Hook
  const {
    activeKey,
    subActiveKey,
    hasSubTabs,
    subTabItems,
    fetchData,
    refreshData,
    onSubChange,
    onChange,
  } = useFavoriteTabs({
    tabs,
    getFavoriteFolders,
    getFavoriteDetail,
    getListData,
    clearList,
  });

  // 滚动位置保存与恢复
  useEffect(() => {
    const scrollableNode = scrollableNodeRef.current;
    if (!scrollableNode) return;

    const handleScroll = debounce(() => {
      vscode.postMessage({
        command: "SAVE_SCROLL_POSITION",
        payload: scrollableNode.scrollTop,
      });
    }, 500);

    const messageHandler = (ev: MessageEvent<any>) => {
      if (ev.type !== "message" || !ev.data?.command) return;
      if (ev.data.command === "RESTORE_SCROLL_POSITION") {
        if (scrollableNodeRef.current) {
          scrollableNodeRef.current.scrollTop = ev.data.payload;
        }
      }
    };

    scrollableNode.addEventListener("scroll", handleScroll);
    window.addEventListener("message", messageHandler);

    return () => {
      scrollableNode.removeEventListener("scroll", handleScroll);
      window.removeEventListener("message", messageHandler);
    };
  }, []);

  // 初始化加载
  useEffect(() => {
    if (list.length === 0) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Tabs
        className="tabs"
        items={tabs as TabsProps["items"]}
        activeKey={activeKey}
        onChange={onChange}
        centered
      />
      {hasSubTabs && (
        <Tabs
          className="tabs"
          items={subTabItems as TabsProps["items"]}
          activeKey={subActiveKey}
          onChange={onSubChange}
          centered
          style={{ top: "46px" }}
        />
      )}
      <div
        id="scrollableDiv"
        ref={scrollableNodeRef}
        className="list"
        style={{
          paddingTop: hasSubTabs ? "96px" : "53px",
          height: hasSubTabs ? "calc(100vh - 96px)" : "calc(100vh - 53px)",
        }}
      >
        {isFetching && list.length === 0 ? (
          loaderFunc()
        ) : (
          <InfiniteScroll
            dataLength={list.length}
            next={fetchData}
            loader={isFetching ? loaderFunc() : null}
            endMessage={<Divider plain>没有了🤐</Divider>}
            hasMore={list.length < total}
            scrollThreshold={0.95}
            scrollableTarget="scrollableDiv"
          >
            <div className="video-grid">
              {list?.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <VideoCard
                    item={item}
                    onCopyLink={copyLink}
                    onAddToWatchLater={
                      activeKey !== "watchlater" ? addToWatchLater : undefined
                    }
                    onDeleteFromWatchLater={
                      activeKey === "watchlater" ? delFromWatchLater : undefined
                    }
                    onGetPlayUrl={getPlayUrl}
                    onGetDanmaku={getDanmaku}
                    onUserClick={(owner) => {
                      setSelectedUser(owner);
                      setUserProfileOpen(true);
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>

      {/* 浮动按钮组 */}
      <FloatButton.Group
        shape="circle"
        style={{ insetInlineEnd: 24, bottom: 88 }}
      >
        {/* 搜索按钮 */}
        <FloatButton
          onClick={() => setSearchDrawerOpen(true)}
          icon={<SearchOutlined style={{ color: "#faad14" }} />}
          tooltip={{ title: "搜索", placement: "left" }}
        />
        {/* 播放待看列表前10条 */}
        {activeKey === "watchlater" && list.length > 0 && (
          <FloatButton
            onClick={() => {
              const top10 = list.slice(0, 10);
              addListToPlaylist(top10);
              message.success(`已将前${top10.length}条加入播放列表`);
            }}
            icon={<PlaySquareOutlined style={{ color: "#fb7299" }} />}
            tooltip={{ title: "播放前10条", placement: "left" }}
          />
        )}
        {/* 减小字体 */}
        <FloatButton
          onClick={decrease}
          icon={<MinusOutlined style={{ color: "#52c41a" }} />}
          tooltip={{ title: "减小字体", placement: "left" }}
        />
        {/* 加大字体 */}
        <FloatButton
          onClick={increase}
          icon={<PlusOutlined style={{ color: "#ff4d4f" }} />}
          tooltip={{ title: "加大字体", placement: "left" }}
        />
        {/* 刷新 */}
        <FloatButton
          onClick={refreshData}
          icon={<RedoOutlined style={{ color: "#fb7299" }} />}
          tooltip={{ title: "刷新", placement: "left" }}
        />
        {/* 回到顶部 */}
        <FloatButton.BackTop
          visibilityHeight={500}
          duration={1000}
          icon={<VerticalAlignTopOutlined style={{ color: "#00a1d6" }} />}
          tooltip={{ title: "回到顶部", placement: "left" }}
          target={() => scrollableNodeRef.current || window}
        />
      </FloatButton.Group>

      {/* 搜索抽屉 */}
      <SearchDrawer
        open={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
        onGetPlayUrl={getPlayUrl}
        onGetDanmaku={getDanmaku}
      />

      {/* 悬浮播放条 */}
      <PlayBar />

      {/* 用户主页抽屉 */}
      <UserProfileDrawer
        open={userProfileOpen}
        user={selectedUser}
        onClose={() => setUserProfileOpen(false)}
        onGetUserVideos={getUserVideos}
        onGetUserCard={getUserCard}
        onModifyRelation={modifyRelation}
        onAddToWatchLater={addToWatchLater}
      />
    </>
  );
}

export default App;
