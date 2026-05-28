/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-17 17:57:55
 * @LastEditTime: 2025-09-26 18:05:21
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\App.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  useRef,
} from "react";
import { Divider, FloatButton, Tabs, TabsProps } from "antd";
import { motion } from "framer-motion";
import "./style/index.less";
import {
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  RedoOutlined,
  SearchOutlined,
  VerticalAlignTopOutlined,
  PlusOutlined,
  MinusOutlined,
  UserOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import _relativeTime from "dayjs/plugin/relativeTime";
import WeiboCard from "./components/WeiboCard";
import { loaderFunc } from "./utils/loader";
import {
  buildWeiboTabsFromGroups,
  defaultWeiboActiveKey,
  getWeiboUidFromGroups,
  type WeiboGroupsResponse,
  type WeiboTab,
} from "./data/tabs";
import useWeiboAction from "./hooks/useWeiboAction";
import { vscode } from "./utils/vscode";
import { useFontSizeStore } from "./store/fontSize";
import { debounce } from "./utils";
const SendWeiboDrawer = lazy(() => import("./components/SendWeiboDrawer"));
const UserDetailDrawer = lazy(() => import("./components/UserDetailDrawer"));
const SearchDrawer = lazy(() => import("./components/SearchDrawer"));
dayjs.locale("zh-cn");
dayjs.extend(_relativeTime);

function App() {
  const scrollableNodeRef = useRef<HTMLDivElement>(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const {
    list,
    total,
    copyLink,
    clearList,
    handleToggleComments,
    handleExpandLongWeibo,
    userDetailVisible,
    setUserDetailVisible,
    userDetail,
    setUserDetail,
    getUserBlog,
    sendLoading,
    setSendLoading,
    handleCommentOrRepost,
    handleLike,
    handleSendWeibo,
    cancelFollow,
    followUser,
    getListData,
    getUserByName,
    getWeiboGroups,
    isFetching,
  } = useWeiboAction();
  // 状态管理
  const [tabs, setTabs] = useState<WeiboTab[]>([]);
  const [activeKey, setActiveKey] = useState("");
  const [myWeiboUid, setMyWeiboUid] = useState("");
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState<string | undefined>();
  // 子菜单key
  const [subAcitiveKey, setSubActiveKey] = useState("");
  const { increase, decrease } = useFontSizeStore();

  // showImg
  const [showImg, setShowImg] = useState(
    window.showImg != undefined ? window.showImg : true,
  );

  const handleTopicClick = useCallback((topic: string) => {
    console.log("topic", topic);
    setSearchDrawerOpen(true);
    setSearchKeyword(topic);
  }, []);

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
    const currentKey = subAcitiveKey || activeKey;
    if (!currentKey) return;
    getListData(currentKey);
  }, [subAcitiveKey, activeKey, getListData]);

  const initTabs = useCallback(async () => {
    try {
      const result = (await getWeiboGroups()) as WeiboGroupsResponse;
      const nextTabs = buildWeiboTabsFromGroups(result);
      const nextActiveKey = defaultWeiboActiveKey(nextTabs);

      setTabs(nextTabs);
      setActiveKey(nextActiveKey);
      setSubActiveKey("");
      setMyWeiboUid(getWeiboUidFromGroups(result));

      if (nextActiveKey) {
        getListData(nextActiveKey, true);
      }
    } catch (error) {
      console.error("GET_WEIBO_GROUPS_ERROR", error);
    }
  }, [getListData, getWeiboGroups]);

  // 初始化，先拉取当前用户的微博分组
  useEffect(() => {
    initTabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 获取当前tab
  const curTab = useMemo(() => {
    return tabs.find((item) => item.key === activeKey);
  }, [activeKey, tabs]);

  // 子菜单切换
  const onSubChange = useCallback(
    (key: string) => {
      setSubActiveKey(key);
      clearList();
      getListData(key, true);
    },
    [clearList, getListData],
  );

  // tab��换
  const onChange = useCallback(
    (key: string) => {
      clearList();
      setActiveKey(key);
      const curTab = tabs.find((item) => item.key === key);
      if (curTab && curTab.childrenList && curTab.childrenList.length > 0) {
        setSubActiveKey(curTab.childrenList?.[0]!.key || "");
        getListData(curTab.childrenList?.[0]!.key || "", true);
      } else {
        setSubActiveKey("");
        getListData(key, true);
      }
    },
    [clearList, getListData, tabs],
  );

  useEffect(() => {
    const messageHandler = (ev: MessageEvent<any>) => {
      if (ev.type !== "message" || ev.data?.command !== "WEIBO_RELOAD_GROUPS") {
        return;
      }
      initTabs();
    };

    window.addEventListener("message", messageHandler);

    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, [initTabs]);

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
      {curTab && curTab.childrenList && (
        <Tabs
          className="tabs"
          items={curTab.childrenList as TabsProps["items"]}
          activeKey={subAcitiveKey}
          onChange={onSubChange}
          centered
          style={{
            top: "46px",
          }}
        />
      )}
      <div
        id="scrollableDiv"
        ref={scrollableNodeRef}
        className="list"
        style={{
          paddingTop: curTab && curTab.childrenList ? "95px" : "47px",
          height:
            curTab && curTab.childrenList
              ? "calc(100vh - 90px)"
              : "calc(100vh - 44px)",
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
            {list?.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <WeiboCard
                  getUserByName={getUserByName}
                  item={item}
                  onUserClick={getUserBlog}
                  onFollow={followUser}
                  cancelFollow={cancelFollow}
                  showActions={true}
                  onExpandLongWeibo={handleExpandLongWeibo}
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
        className="touchfish-float-backtop"
        shape="circle"
        style={{ insetInlineEnd: 24, bottom: 24 }}
        visibilityHeight={500}
        duration={1000}
        icon={<VerticalAlignTopOutlined />}
        tooltip={{ title: "回到顶部", placement: "left" }}
        target={() => scrollableNodeRef.current || window}
      />
      <div ref={groupRef}>
        {/* 刷新按钮 */}
        <FloatButton
          className="touchfish-float-refresh"
          shape="circle"
          style={{ insetInlineEnd: 24, bottom: 88 }}
          onClick={() => {
            const key = subAcitiveKey || activeKey;
            clearList();
            getListData(key, true);
          }}
          icon={<RedoOutlined style={{ color: "#b37feb" }} />}
          tooltip={{ title: "刷新", placement: "left" }}
        />
        <FloatButton.Group
          trigger="click"
          open={groupOpen}
          onOpenChange={(open) => {
            const event = window.event as MouseEvent;
            if (event && groupRef.current?.contains(event.target as Node)) {
              setGroupOpen(open);
            }
          }}
          shape="circle"
          style={{ insetInlineEnd: 24, bottom: 152 }}
          icon={<AppstoreOutlined />}
        >

          {/* 用户按钮 */}
          <FloatButton
            shape="circle"
            onClick={() => {
              if (myWeiboUid) getUserByName(myWeiboUid);
            }}
            icon={<UserOutlined style={{ color: "#faad14" }} />}
            tooltip={{ title: "用户", placement: "left" }}
          />
          {/* 搜索按钮 */}
          <FloatButton
            shape="circle"
            onClick={() => setSearchDrawerOpen(true)}
            icon={<SearchOutlined style={{ color: "#faad14" }} />}
            tooltip={{ title: "搜索", placement: "left" }}
          />
          {/* 发布微博按钮 */}
          <FloatButton
            shape="circle"
            type="primary"
            icon={<EditOutlined style={{ color: "#69b1ff" }} />}
            onClick={() => setSendDrawerOpen((open) => !open)}
            tooltip={{ title: "发布微博", placement: "left" }}
          />
          {/* 显示图片按钮 */}
          <FloatButton
            shape="circle"
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
          {/* 加大字体按钮 */}
          <FloatButton
            shape="circle"
            onClick={increase}
            icon={<PlusOutlined style={{ color: "#ff4d4f" }} />}
            tooltip={{ title: "加大字体", placement: "left" }}
          />
          {/* 减小字体按钮 */}
          <FloatButton
            shape="circle"
            onClick={decrease}
            icon={<MinusOutlined style={{ color: "#52c41a" }} />}
            tooltip={{ title: "减小字体", placement: "left" }}
          />
        </FloatButton.Group>
      </div>
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
        <SendWeiboDrawer
          loading={sendLoading}
          open={sendDrawerOpen}
          onClose={() => {
            setSendDrawerOpen(false);
            setSendLoading(false);
          }}
          onSend={handleSendWeibo}
        />
      </Suspense>
    </>
  );
}

export default App;
