/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 09:19:24
 * @LastEditTime: 2025-08-19 15:27:49
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\App.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */

import { useEffect, useState, useCallback, useRef, type Key } from "react";
import { Divider, FloatButton } from "antd";
import "./style/index.less";
import {
  RedoOutlined,
  VerticalAlignTopOutlined,
  SearchOutlined,
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
import { Tabs, Tab } from "@heroui/react";

function App() {
  const APPSOURCE = "ZHIHUAPP";
  const scrollableNodeRef = useRef<HTMLDivElement>(null);
  const {
    list,
    contextHolder,
    clearList,
    getListData,
    questionDetailDrawerOpen,
    questionData,
    setQuestionData,
    questionTitle,
    openQuestionDetailDrawer,
    closeQuestionDetailDrawer,
    handleVote,
    voteHandler,
    questionDetail,
    isFollowing,
    followHandler,
    unfollowHandler,
  } = useZhihuAction(APPSOURCE, scrollableNodeRef);
  const [tabs] = useState(defTab);
  const [searchDrawerOpen, setSearchDrawerOpen] = useState(false);

  const [activeKey, setActiveKey] = useState(defTab[0].key);

  useEffect(() => {
    const scrollableDiv = scrollableNodeRef.current;
    if (!scrollableDiv) return;

    const debouncedSave = debounce((scrollTop: number) => {
      vscode.postMessage({
        command: "ZHIHU_SAVE_SCROLL_POSITION",
        payload: scrollTop,
      });
    }, 500);

    const handleScroll = () => {
      debouncedSave(scrollableDiv.scrollTop);
    };

    scrollableDiv.addEventListener("scroll", handleScroll);

    return () => {
      scrollableDiv.removeEventListener("scroll", handleScroll);
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
      getListData(key);
    },
    [clearList, getListData]
  );

  return (
    <>
      {contextHolder}
      <Tabs
        radius="full"
        className="fixed z-50 bottom-2.5 w-full justify-center "
        onSelectionChange={onChange}
        classNames={{
          tabList: "backdrop-style",
          tabContent: "text-gray-300",
        }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.key} title={tab.label} className="pl-4 pr-4" />
        ))}
      </Tabs>
      <div ref={scrollableNodeRef} className="list">
        <InfiniteScroll
          dataLength={list.length}
          next={fetchData}
          loader={loaderFunc(1)}
          endMessage={<Divider plain>没有了🤐</Divider>}
          hasMore={activeKey != "hot" ? true : false}
          scrollThreshold={0.95}
        >
          {list.map((item: ZhihuItemData) => (
            <ZhihuItem
              item={item}
              key={item.id}
              openQuestionDetailDrawer={openQuestionDetailDrawer}
              handleVote={handleVote}
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
        />
        <FloatButton
          icon={<SearchOutlined style={{ color: "#faad14" }} />}
          tooltip={{ title: "搜索", placement: "left" }}
          onClick={() => setSearchDrawerOpen(true)}
        />
        <FloatButton
          onClick={() => {
            clearList();
            fetchData();
          }}
          icon={<RedoOutlined style={{ color: "#b37feb" }} />}
          tooltip={{ title: "刷新", placement: "left" }}
        />
      </FloatButton.Group>
      <Suspense fallback={<div>Loading...</div>}>
        <QuestionDetailDrawer
          open={questionDetailDrawerOpen}
          onClose={closeQuestionDetailDrawer}
          questionData={questionData}
          setQuestionData={setQuestionData}
          title={questionTitle}
          voteHandler={voteHandler}
          questionDetail={questionDetail}
          isFollowing={isFollowing}
          followHandler={followHandler}
          unfollowHandler={unfollowHandler}
        />
      </Suspense>
      <SearchDrawer
        open={searchDrawerOpen}
        onClose={() => setSearchDrawerOpen(false)}
        source={APPSOURCE}
        openQuestionDetailDrawer={openQuestionDetailDrawer}
        voteHandler={voteHandler}
      />
    </>
  );
}

export default App;
