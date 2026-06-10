/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 09:19:24
 * @LastEditTime: 2025-11-14 10:23:32
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\App.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { Divider, FloatButton, Tabs } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import "./style/index.less";
import {
  RedoOutlined,
  VerticalAlignTopOutlined,
  SearchOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CompressOutlined,
  PlusOutlined,
  MinusOutlined,
  AppstoreOutlined,
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
  () => import("./components/QuestionDetailDrawer"),
);
import type { ZhihuItemData } from "../../types/zhihu";
import useZhihuAction from "./hooks/useZhihuAction";
import { debounce } from "./utils";
import { vscode } from "./utils/vscode";
import { messageHandler } from "./utils/messageHandler";
import { useHasExpanded, useExpandedStore } from "./store/expanded";
import type { ExpandedState } from "./store/expanded";
import { useFontSizeStore } from "./store/fontSize";

function App() {
  const scrollableNodeRef = useRef<HTMLDivElement>(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const [floatButtonsVisible, setFloatButtonsVisible] = useState(true);
  const floatBtnVisibleRef = useRef(true);
  const lastScrollTop = useRef(0);
  const {
    list,
    clearList,
    getListData,
    fetchNext,
    hasMore,
    hasMoreQuestion,
    fetchQuestionNext,
    currentQuestionId,
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
    questionOrder,
    changeQuestionOrder,
  } = useZhihuAction();
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [showImg, setShowImg] = useState(
    window.showImg != undefined ? window.showImg : true,
  );
  const zhihuAutoHideBtn = window.zhihuAutoHideBtn ?? false;

  const [activeKey, setActiveKey] = useState(defTab[0].key);
  const hasExpanded = useHasExpanded();
  const collapseAll = useExpandedStore(
    (state: ExpandedState) => state.collapseAll,
  );
  const { increase, decrease } = useFontSizeStore();

  useEffect(() => {
    const scrollableNode = scrollableNodeRef.current;
    if (!scrollableNode) return;

    const handleScroll = debounce(() => {
      vscode.postMessage({
        command: "ZHIHU_SAVE_SCROLL_POSITION",
        payload: scrollableNode.scrollTop,
      });
    }, 500);
    scrollableNode.addEventListener("scroll", handleScroll);

    const unsolicitedMessageHandler = (command: string, payload: any) => {
      if (command === "ZHIHU_RESTORE_SCROLL_POSITION") {
        if (scrollableNodeRef.current) {
          scrollableNodeRef.current.scrollTop = payload;
        }
      }
    };
    const removeListener = messageHandler.addUnsolicitedListener(
      unsolicitedMessageHandler,
    );

    // 自动隐藏按钮逻辑
    let handleAutoHideScroll: (() => void) | null = null;
    if (zhihuAutoHideBtn) {
      handleAutoHideScroll = () => {
        const currentScrollTop = scrollableNode.scrollTop;
        const isScrollingDown = currentScrollTop > lastScrollTop.current;

        if (isScrollingDown && currentScrollTop > 30) {
          // 向下滚动且滚动距离超过30px时隐藏按钮
          if (floatBtnVisibleRef.current) {
            floatBtnVisibleRef.current = false;
            setFloatButtonsVisible(false);
          }
        } else if (!isScrollingDown) {
          // 向上滚动时显示按钮
          if (!floatBtnVisibleRef.current) {
            floatBtnVisibleRef.current = true;
            setFloatButtonsVisible(true);
          }
        }

        lastScrollTop.current = currentScrollTop;
      };

      scrollableNode.addEventListener("scroll", handleAutoHideScroll);
    }

    return () => {
      scrollableNode.removeEventListener("scroll", handleScroll);
      if (handleAutoHideScroll) {
        scrollableNode.removeEventListener("scroll", handleAutoHideScroll);
      }
      removeListener();
    };
  }, [zhihuAutoHideBtn]);

  const fetchData = useCallback(() => {
    // load next page (initial load will call getListData via fetchNext)
    fetchNext(activeKey);
  }, [activeKey, fetchNext]);

  useEffect(() => {
    if (list.length === 0) getListData({ tab: activeKey }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = useCallback(
    (key: string) => {
      clearList();
      setActiveKey(key as "hot" | "follow" | "recommend" | "hot_question");
      getListData({ tab: key }, true);
    },
    [clearList, getListData],
  );

  return (
    <>
      <AnimatePresence>
        {floatButtonsVisible && (
          <motion.div
            key="tabs-shell"
            className="tabs-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Tabs
              activeKey={activeKey}
              centered
              className="zhihu-tabs dynamic-font-size"
              items={defTab.map((tab) => ({
                key: tab.key,
                label: tab.label,
                children: null,
              }))}
              onChange={onChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div id="scrollableDiv" ref={scrollableNodeRef} className="list">
        {loading && list.length === 0 ? (
          loaderFunc()
        ) : (
          <InfiniteScroll
            dataLength={list.length}
            next={fetchData}
            loader={loading ? loaderFunc() : null}
            endMessage={<Divider plain>没有了🤐</Divider>}
            hasMore={hasMore(activeKey as string)}
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
      <AnimatePresence>
        {floatButtonsVisible && (
          <motion.div
            key="float-buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FloatButton.BackTop
              className="touchfish-float-backtop"
              style={{ insetInlineEnd: 24, bottom: 24 }}
              visibilityHeight={500}
              duration={1000}
              icon={<VerticalAlignTopOutlined />}
              tooltip={{ title: "回到顶部", placement: "left" }}
              target={() => scrollableNodeRef.current || window}
            />
            <div ref={groupRef}>
              <FloatButton
                className="touchfish-float-refresh"
                style={{ insetInlineEnd: 24, bottom: 88 }}
                onClick={() => {
                  clearList();
                  getListData(activeKey, true);
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
                <FloatButton
                  icon={<SearchOutlined style={{ color: "#faad14" }} />}
                  tooltip={{ title: "搜索", placement: "left" }}
                  onClick={() => setSearchDrawerOpen(true)}
                />

                {hasExpanded && (
                  <FloatButton
                    onClick={() => collapseAll()}
                    icon={<CompressOutlined style={{ color: "#a0d911" }} />}
                    tooltip={{ title: "折叠已展开", placement: "left" }}
                  />
                )}
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
                    title: `${showImg ? "隐藏" : "显示"}图片`,
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
          fetchNext={fetchQuestionNext}
          questionId={currentQuestionId}
          hasMore={hasMoreQuestion(currentQuestionId as string)}
          showImg={showImg}
          questionOrder={questionOrder}
          changeQuestionOrder={changeQuestionOrder}
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
