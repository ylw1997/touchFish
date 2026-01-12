/*
 * @Description: Bilibili 扩展主应用
 */

import { useEffect, useState, useRef } from "react";
import { Divider, FloatButton, Tabs, TabsProps } from "antd";
import { motion } from "framer-motion";
import "./style/index.less";
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  RedoOutlined,
  VerticalAlignTopOutlined,
  PlusOutlined,
  MinusOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import _relativeTime from "dayjs/plugin/relativeTime";
import VideoCard from "./components/VideoCard";
import { loaderFunc } from "./utils/loader";
import { defTab, TabItem } from "./data/tabs";
import useBilibiliAction from "./hooks/useBilibiliAction";
import { useFavoriteTabs } from "./hooks/useFavoriteTabs";
import { vscode } from "./utils/vscode";
import { useFontSizeStore } from "./store/fontSize";
import { debounce } from "./utils";
import PlayBar from "./components/PlayBar";

dayjs.locale("zh-cn");
dayjs.extend(_relativeTime);

function App() {
  const scrollableNodeRef = useRef<HTMLDivElement>(null);
  const [tabs] = useState<TabItem[]>(defTab);
  const { increase, decrease } = useFontSizeStore();

  // showImg
  const [showImg, setShowImg] = useState(
    window.showImg != undefined ? window.showImg : true
  );

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
  } = useBilibiliAction();

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
                    showImg={showImg}
                  />
                </motion.div>
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>

      {/* 回到顶部 */}
      <FloatButton.BackTop
        shape="circle"
        style={{ insetInlineEnd: 24, bottom: 88 }}
        visibilityHeight={500}
        duration={1000}
        icon={<VerticalAlignTopOutlined style={{ color: "#00a1d6" }} />}
        tooltip={{ title: "回到顶部", placement: "left" }}
        target={() => scrollableNodeRef.current || window}
      />

      {/* 刷新 */}
      <FloatButton
        shape="circle"
        style={{ insetInlineEnd: 24, bottom: 148 }}
        onClick={refreshData}
        icon={<RedoOutlined style={{ color: "#fb7299" }} />}
        tooltip={{ title: "刷新", placement: "left" }}
      />

      {/* 更多功能 */}
      <FloatButton.Group
        shape="circle"
        trigger="click"
        style={{ insetInlineEnd: 24, bottom: 208 }}
        icon={<AppstoreOutlined style={{ color: "#00a1d6" }} />}
        tooltip={{ title: "更多", placement: "left" }}
      >
        <FloatButton
          onClick={() => {
            const newState = !showImg;
            setShowImg(newState);
            vscode.postMessage({
              command: "TOGGLE_SHOW_IMG",
              payload: newState,
            });
          }}
          icon={
            showImg ? (
              <EyeOutlined style={{ color: "#13c2c2" }} />
            ) : (
              <EyeInvisibleOutlined style={{ color: "#13c2c2" }} />
            )
          }
          tooltip={{
            title: `${showImg ? "隐藏" : "显示"}封面`,
            placement: "left",
          }}
        />
        <FloatButton
          onClick={increase}
          icon={<PlusOutlined style={{ color: "#ff4d4f" }} />}
          tooltip={{ title: "加大字体", placement: "left" }}
        />
        <FloatButton
          onClick={decrease}
          icon={<MinusOutlined style={{ color: "#52c41a" }} />}
          tooltip={{ title: "减小字体", placement: "left" }}
        />
      </FloatButton.Group>

      {/* 悬浮播放条 */}
      <PlayBar />
    </>
  );
}

export default App;
