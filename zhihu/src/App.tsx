/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 09:19:24
 * @LastEditTime: 2025-08-07 11:28:37
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\App.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { Divider, FloatButton, Tabs, type TabsProps } from "antd";
import "./style/index.less";
import { RedoOutlined, VerticalAlignTopOutlined } from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import _relativeTime from "dayjs/plugin/relativeTime";
import { defTab } from "./data/tabs";
import ZhihuItem from "./components/ZhihuItem";
import { loaderFunc } from "./utils/loader";
dayjs.locale("zh-cn");
dayjs.extend(_relativeTime);

import useZhihuAction from "./hooks/useZhihuAction";
import type { ZhihuItemData } from "../../type";

function App() {
  const APPSOURCE = "ZHIHUAPP";
  const { list, contextHolder, clearList, getListData } =
    useZhihuAction(APPSOURCE);
  const [tabs] = useState(defTab);
  const scrollableNodeRef = useRef<HTMLDivElement>(null);
  const [activeKey, setActiveKey] = useState(defTab[0].key);
  const fetchData = useCallback(() => {
    getListData(activeKey);
  }, [activeKey, getListData]);

  useEffect(() => {
    if (list.length === 0) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = useCallback(
    (key: string) => {
      clearList();
      setActiveKey(key);
      getListData(key);
    },
    [clearList, getListData]
  );

  return (
    <>
      {contextHolder}
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
          paddingTop: "44px",
          height: "calc(100vh - 44px)",
        }}
      >
        <InfiniteScroll
          dataLength={list.length}
          next={fetchData}
          loader={loaderFunc(1)}
          endMessage={<Divider plain>没有了🤐</Divider>}
          hasMore={true}
          scrollableTarget="scrollableDiv"
        >
          {list.map((item: ZhihuItemData) => (
            <ZhihuItem item={item} key={item.id} />
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
        <FloatButton
          onClick={() => {
            clearList();
            fetchData();
          }}
          icon={<RedoOutlined style={{ color: "#b37feb" }} />}
          tooltip={{ title: "刷新", placement: "left" }}
        />
      </FloatButton.Group>
    </>
  );
}

export default App;
