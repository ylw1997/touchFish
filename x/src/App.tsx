/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-17 17:57:55
 * @LastEditTime: 2025-09-26 18:05:21
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\x\src\App.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */

import {
  useEffect,
  useState,
  useCallback,
  lazy,
  Suspense,
  useRef,
} from "react";
import { Divider, FloatButton, Tabs, TabsProps } from "antd";
import { motion } from "framer-motion";
import "./style/index.less";
import {
  VerticalAlignTopOutlined,
  PlusOutlined,
  MinusOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  SearchOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import _relativeTime from "dayjs/plugin/relativeTime";
import XCard from "./components/XCard";
import { loaderFunc } from "./utils/loader";
import { defTab } from "./data/tabs";
import useXAction from "./hooks/useXAction";
import { vscode } from "./utils/vscode";
import { useFontSizeStore } from "./store/fontSize";
import { debounce } from "./utils";
const SendXDrawer = lazy(() => import("./components/SendXDrawer"));
const UserDetailDrawer = lazy(() => import("./components/UserDetailDrawer"));
const SearchDrawer = lazy(() => import("./components/SearchDrawer"));
dayjs.locale("zh-cn");
dayjs.extend(_relativeTime);

function App() {
  const scrollableNodeRef = useRef<HTMLDivElement>(null);
  const {
    list,
    hasMore,
    copyLink,
    clearList,
    handleToggleComments,
    handleExpandLongX,
    userDetailVisible,
    setUserDetailVisible,
    userDetail,
    setUserDetail,
    getUserBlog,
    sendLoading,
    setSendLoading,
    handleCommentOrRepost,
    handleLike,
    handleSendX,
    cancelFollow,
    followUser,
    getListData,
    getUserByName,
    isFetching,
  } = useXAction();
  // 状态管理
  const [tabs] = useState(defTab);
  const [activeKey, setActiveKey] = useState(defTab[0].key);
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState<string | undefined>();
  const { increase, decrease } = useFontSizeStore();

  // showImg
  const [showImg, setShowImg] = useState(
    window.showImg != undefined ? window.showImg : true,
  );

  const handleTopicClick = useCallback(
    (topic: string) => {
      console.log("topic", topic);
      setSearchDrawerOpen(true);
      setSearchKeyword(topic);
    },
    [setSearchDrawerOpen, setSearchKeyword],
  );

  // Save scroll position on scroll
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

  // 请求数据（主列表/用户微博）
  const fetchData = useCallback(() => {
    getListData(activeKey);
  }, [activeKey, getListData]);

  // 初始化，尝试从缓存恢复
  useEffect(() => {
    if (list.length === 0) fetchData();
  }, [fetchData, list.length]);

  // tab切换
  const onChange = useCallback(
    (key: string) => {
      clearList();
      setActiveKey(key);
      getListData(key, true);
    },
    [clearList, getListData],
  );

  return (
    <>
      <Suspense fallback={null}>
        <UserDetailDrawer
          visible={userDetailVisible}
          userDetail={userDetail}
          onClose={() => {
            setUserDetailVisible(false);
            setUserDetail(undefined);
          }}
          setUserDetail={setUserDetail}
          showImg={showImg}
          onTopicClick={handleTopicClick}
        />
      </Suspense>
      <Tabs
        className="tabs"
        items={tabs as TabsProps["items"]}
        activeKey={activeKey}
        onChange={onChange}
        centered
      />
      <div
        id="scrollableDiv"
        ref={scrollableNodeRef}
        className="list"
        style={{
          paddingTop: "47px",
          height: "calc(100vh - 44px)",
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
            hasMore={hasMore}
            scrollThreshold={0.95}
            scrollableTarget="scrollableDiv"
          >
            {list?.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <XCard
                  getUserByName={getUserByName}
                  item={item}
                  onUserClick={getUserBlog}
                  onFollow={followUser}
                  cancelFollow={cancelFollow}
                  showActions={true}
                  onExpandLongX={handleExpandLongX}
                  onToggleComments={handleToggleComments}
                  onCopyLink={copyLink}
                  onCommentOrRepost={handleCommentOrRepost}
                  onLikeOrCancelLike={handleLike}
                  showImg={showImg}
                  onTopicClick={handleTopicClick}
                />
              </motion.div>
            ))}
          </InfiniteScroll>
        )}
      </div>
      {/* 回到顶部按钮 */}
      <FloatButton.BackTop
        shape="circle"
        style={{ insetInlineEnd: 24, bottom: 324 }}
        visibilityHeight={500}
        duration={1000}
        icon={<VerticalAlignTopOutlined style={{ color: "#f37fb7" }} />}
        tooltip={{ title: "回到顶部", placement: "left" }}
        target={() => scrollableNodeRef.current || window}
      />
      {/* 刷新按钮 */}
      <FloatButton
        shape="circle"
        style={{ insetInlineEnd: 24, bottom: 24 }}
        onClick={() => {
          clearList();
          getListData(activeKey, true);
        }}
        icon={<RedoOutlined style={{ color: "#b37feb" }} />}
        tooltip={{ title: "刷新", placement: "left" }}
      />
      {/* 搜索按钮 */}
      <FloatButton
        onClick={() => setSearchDrawerOpen(true)}
        icon={<SearchOutlined style={{ color: "#faad14" }} />}
        tooltip={{ title: "搜索", placement: "left" }}
        style={{ insetInlineEnd: 24, bottom: 84 }}
      />

      {/* 显示图片 */}
      <FloatButton
        style={{ insetInlineEnd: 24, bottom: 144 }}
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
          title: `${showImg ? "隐藏" : "显示"}图片`,
          placement: "left",
        }}
      />
      <FloatButton
        style={{ insetInlineEnd: 24, bottom: 204 }}
        onClick={increase}
        icon={<PlusOutlined style={{ color: "#ff4d4f" }} />}
        tooltip={{ title: "加大字体", placement: "left" }}
      />
      <FloatButton
        style={{ insetInlineEnd: 24, bottom: 264 }}
        onClick={decrease}
        icon={<MinusOutlined style={{ color: "#52c41a" }} />}
        tooltip={{ title: "减小字体", placement: "left" }}
      />
      <Suspense fallback={null}>
        <SearchDrawer
          open={searchDrawerOpen}
          onClose={() => {
            setSearchDrawerOpen(false);
            setSearchKeyword(undefined);
          }}
          getUserBlog={getUserBlog}
          showImg={showImg}
          initialKeyword={searchKeyword}
          onTopicClick={handleTopicClick}
          getUserByName={getUserByName}
        />
      </Suspense>
      <Suspense fallback={null}>
        <SendXDrawer
          loading={sendLoading}
          open={sendDrawerOpen}
          onClose={() => {
            setSendDrawerOpen(false);
            setSendLoading(false);
          }}
          onSend={handleSendX}
        />
      </Suspense>
    </>
  );
}

export default App;
