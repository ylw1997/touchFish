/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-17 17:57:55
 * @LastEditTime: 2025-07-31 16:15:45
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
import "./style/index.less";
import {
  EditOutlined,
  PictureOutlined,
  RedoOutlined,
  SearchOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import _relativeTime from "dayjs/plugin/relativeTime";
import WeiboCard from "./components/WeiboCard";
import { loaderFunc } from "./utils/loader";
import { defTab } from "./data/tabs";
import useWeiboAction from "./hooks/useWeiboAction";
import { vscode } from "./utils/vscode";
import { debounce } from "./utils";
const SendWeiboDrawer = lazy(() => import("./components/SendWeiboDrawer"));
const UserDetailDrawer = lazy(() => import("./components/UserDetailDrawer"));
const SearchDrawer = lazy(() => import("./components/SearchDrawer"));
dayjs.locale("zh-cn");
dayjs.extend(_relativeTime);

function App() {
  const APPSOURCE = "WEIBOAPP";
  const scrollableNodeRef = useRef<HTMLDivElement>(null);
  const {
    list,
    total,
    copyLink,
    contextHolder,
    messageApi,
    clearList,
    max_id,
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
  } = useWeiboAction(APPSOURCE, scrollableNodeRef);
  // 状态管理
  const [tabs] = useState(defTab);
  const [activeKey, setActiveKey] = useState(defTab[0].key);
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState<string | undefined>();
  // 子菜单key
  const [subAcitiveKey, setSubActiveKey] = useState("");

  // showImg
  const [showImg, setShowImg] = useState(
    window.showImg != undefined ? window.showImg : true
  );

  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const handleTopicClick = useCallback((topic: string) => {
    setSearchDrawerOpen(true);
    setSearchKeyword(topic);
  }, []);

  // Save scroll position on scroll
  useEffect(() => {
    const scrollableNode = scrollableNodeRef.current;
    if (!scrollableNode) return;

    const handleScroll = debounce(() => {
      vscode.postMessage({
        command: 'SAVE_SCROLL_POSITION',
        payload: scrollableNode.scrollTop
      });
    }, 500);

    scrollableNode.addEventListener('scroll', handleScroll);

    return () => {
      scrollableNode.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handlePlayVideo = (url?: string) => {
    if (!url) {
      setActiveVideoUrl(null); // 如果没有视频链接，则暂停
      return;
    }
    if (activeVideoUrl === url) {
      setActiveVideoUrl(null); // 如果是同一个视频，则暂停
    } else {
      setActiveVideoUrl(url); // 否则，播放新视频
    }
  };

  // 请求数据（主列表/用户微博）
  const fetchData = useCallback(() => {
    const key = subAcitiveKey || activeKey;

    const payload =
      max_id && key !== defTab[0].key ? `${key}&max_id=${max_id}` : key;
    getListData(payload);
  }, [subAcitiveKey, activeKey, max_id, getListData]);

  // 初始化，尝试从缓存恢复
  useEffect(() => {
    if (list.length === 0) fetchData();
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
      getListData(key);
    },
    [clearList, getListData]
  );

  // tab��换
  const onChange = useCallback(
    (key: string) => {
      clearList();
      setActiveKey(key);
      const curTab = tabs.find((item) => item.key === key);
      if (curTab && curTab.childrenList && curTab.childrenList.length > 0) {
        setSubActiveKey(curTab.childrenList?.[0]!.key || "");
        getListData(curTab.childrenList?.[0]!.key || "");
      } else {
        setSubActiveKey("");
        getListData(key);
      }
    },
    [clearList, getListData, tabs]
  );

  return (
    <>
      {contextHolder}
      <Suspense fallback={null}>
        <UserDetailDrawer
          visible={userDetailVisible}
          userDetail={userDetail}
          onClose={() => {
            setUserDetailVisible(false);
            setUserDetail(undefined);
          }}
          setUserDetail={setUserDetail}
          source="userDetail"
          preSource={APPSOURCE}
          showImg={showImg}
          activeVideoUrl={activeVideoUrl}
          onPlayVideo={handlePlayVideo}
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
          paddingTop: curTab && curTab.childrenList ? "90px" : "44px",
          height:
            curTab && curTab.childrenList
              ? "calc(100vh - 90px)"
              : "calc(100vh - 44px)",
        }}
      >
        <InfiniteScroll
          dataLength={list.length}
          next={fetchData}
          loader={loaderFunc(1)}
          endMessage={<Divider plain>没有了🤐</Divider>}
          hasMore={list.length < total}
          scrollableTarget="scrollableDiv"
        >
          {list?.map((item) => (
            <WeiboCard
              getUserByName={getUserByName}
              key={item.id}
              item={item}
              onUserClick={getUserBlog}
              onFollow={(userinfo) => followUser(userinfo, APPSOURCE)}
              cancelFollow={(userinfo) => cancelFollow(userinfo, APPSOURCE)}
              showActions={true}
              onExpandLongWeibo={handleExpandLongWeibo}
              onToggleComments={handleToggleComments}
              onCopyLink={copyLink}
              onCommentOrRepost={handleCommentOrRepost}
              onLikeOrCancelLike={handleLike}
              showImg={showImg}
              activeVideoUrl={activeVideoUrl}
              onPlayVideo={handlePlayVideo}
              onTopicClick={handleTopicClick}
            />
          ))}
        </InfiniteScroll>
      </div>
      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
        <FloatButton.BackTop
          visibilityHeight={500}
          duration={1000}
          icon={<VerticalAlignTopOutlined style={{ color: "#f37fb7" }} />}
          tooltip={{ title: "回到顶部", placement: "left" }}
          target={() => scrollableNodeRef.current || window}
        />
        {/* 搜索按钮 */}
        <FloatButton
          onClick={() => setSearchDrawerOpen(true)}
          icon={<SearchOutlined style={{ color: "#faad14" }} />}
          tooltip={{ title: "搜索", placement: "left" }}
        />
        <FloatButton
          type="primary"
          icon={<EditOutlined style={{ color: "#69b1ff" }} />}
          onClick={() => setSendDrawerOpen((open) => !open)}
          tooltip={{ title: "发布微博", placement: "left" }}
        />
        <FloatButton
          onClick={() => {
            clearList();
            fetchData();
          }}
          icon={<RedoOutlined style={{ color: "#b37feb" }} />}
          tooltip={{ title: "刷新", placement: "left" }}
        />
        {/* 显示图片 */}
        <FloatButton
          onClick={() => {
            messageApi.success(`图片已${showImg ? "隐藏" : "显示"}!`);
            setShowImg((showImg) => !showImg);
          }}
          icon={<PictureOutlined style={{ color: "#13c2c2" }} />}
          tooltip={{
            title: `${showImg ? "隐藏" : "显示"}图片`,
            placement: "left",
          }}
        />
      </FloatButton.Group>
      <Suspense fallback={null}>
        <SearchDrawer
          open={searchDrawerOpen}
          onClose={() => {
            setSearchDrawerOpen(false);
            setSearchKeyword(undefined);
          }}
          getUserBlog={getUserBlog}
          source="search"
          preSource={APPSOURCE}
          showImg={showImg}
          activeVideoUrl={activeVideoUrl}
          onPlayVideo={handlePlayVideo}
          initialKeyword={searchKeyword}
        />
      </Suspense>
      <Suspense fallback={null}>
        <SendWeiboDrawer
          loading={sendLoading}
          open={sendDrawerOpen}
          onClose={() => {
            setSendDrawerOpen(false);
            setSendLoading(false);
            messageApi.destroy("GETNEWBLOGRESULT");
          }}
          onSend={handleSendWeibo}
        />
      </Suspense>
    </>
  );
}

export default App;
