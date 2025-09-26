/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 09:19:24
 * @LastEditTime: 2025-09-26 17:03:21
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\App.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */

import { useEffect, useState, useCallback, useRef, type Key } from "react";
import { Divider, FloatButton } from "antd";
import { motion } from "framer-motion";
import "./style/index.less";
import {
  RedoOutlined,
  VerticalAlignTopOutlined,
  SearchOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import _relativeTime from "dayjs/plugin/relativeTime";
import { defTab } from "./data/tabs";
import ZhihuItem from "./components/ZhihuItem";
import { loaderFunc } from "./utils/loader";
import SearchDrawer from "./components/SearchDrawer";
dayjs.locale("zh-cn");
dayjs.extend(_relativeTime);

import { Suspense, lazy } from "react";
const QuestionDetailDrawer = lazy(
  () => import("./components/QuestionDetailDrawer")
);
import type { ZhihuItemData } from "../../type";
import useZhihuAction from "./hooks/useZhihuAction";
import { debounce } from "./utils";
import { vscode } from "./utils/vscode";
import { messageHandler } from "./utils/messageHandler";
import { Tabs, Tab } from "@heroui/react";

function App() {
  const scrollableNodeRef = useRef<HTMLDivElement>(null);
  const {
    list,
    contextHolder,
    clearList,
    getListData,
    questionDetailDrawerOpen,
    questionData,
    questionTitle,
    openQuestionDetailDrawer,
    closeQuestionDetailDrawer,
    handleVote,
    handleQuestionVote,
    questionDetail,
    isFollowing,
    followHandler,
    unfollowHandler,
    loading,
    messageApi,
  } = useZhihuAction();
  const [tabs] = useState(defTab);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [showImg, setShowImg] = useState(true);

  const [activeKey, setActiveKey] = useState(defTab[0].key);

  useEffect(() => {
    const scrollableNode = scrollableNodeRef.current;
    if (!scrollableNode) return;

    const handleScroll = debounce(() => {
      vscode.postMessage({
        command: 'ZHIHU_SAVE_SCROLL_POSITION',
        payload: scrollableNode.scrollTop
      });
    }, 500);
    scrollableNode.addEventListener("scroll", handleScroll);

    const unsolicitedMessageHandler = (command: string, payload: any) => {
      if (command === 'ZHIHU_RESTORE_SCROLL_POSITION') {
        if (scrollableNodeRef.current) {
          scrollableNodeRef.current.scrollTop = payload;
        }
      }
    };
    const removeListener = messageHandler.addUnsolicitedListener(unsolicitedMessageHandler);

    return () => {
      scrollableNode.removeEventListener("scroll", handleScroll);
      removeListener();
    };
  }, []);

  const fetchData = useCallback(() => {
    getListData(activeKey);
  }, [activeKey, getListData]);

  useEffect(() => {
    if (list.length === 0) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = useCallback(
    (key: Key) => {
      clearList();
      setActiveKey(key as "hot" | "follow" | "recommend");
      getListData(key, true);
    },
    [clearList, getListData]
  );

  return (
    <>
      {contextHolder}
      <Tabs
        radius="full"
        className="fixed z-50 top-2.5 w-full justify-center "
        onSelectionChange={onChange}
        selectedKey={activeKey}
        classNames={{
          tabList: "backdrop-style",
          cursor: "tab-active-style",
          tabContent: "vscode-foreground"
        }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.key} title={tab.label} className="pl-4 pr-4" />
        ))}
      </Tabs>
      <div id="scrollableDiv" ref={scrollableNodeRef} className="list">
        {loading && list.length === 0 ? (
          loaderFunc()
        ) : (
          <InfiniteScroll
            dataLength={list.length}
            next={fetchData}
            loader={loading ? loaderFunc() : null}
            endMessage={<Divider plain>没有了🤐</Divider>}
            hasMore={activeKey != "hot" ? true : false}
            scrollThreshold={0.95}
            scrollableTarget="scrollableDiv"
          >
            {list.map((item: ZhihuItemData) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <ZhihuItem
                  item={item}
                  openQuestionDetailDrawer={openQuestionDetailDrawer}
                  handleVote={handleVote}
                  showImg={showImg}
                />
              </motion.div>
            ))}
          </InfiniteScroll>
        )}
      </div>
      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
        <FloatButton.BackTop
          visibilityHeight={500}
          duration={1000}
          icon={<VerticalAlignTopOutlined style={{ color: "#f37fb7" }} />}
          tooltip={{ title: "回到顶部", placement: "left" }}
          target={() => scrollableNodeRef.current || window}
        />
        <FloatButton
          icon={<SearchOutlined style={{ color: "#faad14" }} />}
          tooltip={{ title: "搜索", placement: "left" }}
          onClick={() => setSearchDrawerOpen(true)}
        />
        <FloatButton
          onClick={() => {
            clearList();
            getListData(activeKey, true);
          }}
          icon={<RedoOutlined style={{ color: "#b37feb" }} />}
          tooltip={{ title: "刷新", placement: "left" }}
        />
        <FloatButton
          onClick={() => {
            messageApi.success(`图片已${showImg ? "隐藏" : "显示"}!`);
            setShowImg((showImg) => !showImg);
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
      </FloatButton.Group>
      <Suspense fallback={<div>Loading...</div>}>
        <QuestionDetailDrawer
          open={questionDetailDrawerOpen}
          onClose={closeQuestionDetailDrawer}
          questionData={questionData}
          title={questionTitle}
          handleVote={handleQuestionVote}
          questionDetail={questionDetail}
          isFollowing={isFollowing}
          followHandler={followHandler}
          unfollowHandler={unfollowHandler}
          showImg={showImg}
        />
      </Suspense>
      <SearchDrawer
        open={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
        openQuestionDetailDrawer={openQuestionDetailDrawer}
        handleVote={handleQuestionVote}
        showImg={showImg}
      />
    </>
  );
}

export default App;
