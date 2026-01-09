/*
 * @Description: Bilibili 扩展主应用
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import { defTab } from "./data/tabs";
import useBilibiliAction from "./hooks/useBilibiliAction";
import { vscode } from "./utils/vscode";
import { useFontSizeStore } from "./store/fontSize";
import { debounce } from "./utils";

dayjs.locale("zh-cn");
dayjs.extend(_relativeTime);

function App() {
  const scrollableNodeRef = useRef<HTMLDivElement>(null);
  const { list, total, copyLink, clearList, getListData, isFetching } =
    useBilibiliAction();

  // 状态管理
  const [tabs] = useState(defTab);
  const [activeKey, setActiveKey] = useState(defTab[0].key);
  const [subActiveKey, setSubActiveKey] = useState("");
  const { increase, decrease } = useFontSizeStore();

  // showImg
  const [showImg, setShowImg] = useState(
    window.showImg != undefined ? window.showImg : true
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

  // 请求数据
  const fetchData = useCallback(() => {
    const currentKey = subActiveKey || activeKey;
    getListData(currentKey);
  }, [subActiveKey, activeKey, getListData]);

  // 初始化
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
      getListData(key, true);
    },
    [clearList, getListData]
  );

  // tab切换
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
    [clearList, getListData, tabs]
  );

  return (
    <>
      <Tabs
        className="tabs"
        items={tabs as TabsProps["items"]}
        activeKey={activeKey}
        onChange={onChange}
        centered
      />
      {curTab && curTab.childrenList && curTab.childrenList.length > 0 && (
        <Tabs
          className="tabs"
          items={curTab.childrenList as TabsProps["items"]}
          activeKey={subActiveKey}
          onChange={onSubChange}
          centered
          style={{
            top: "47px",
          }}
        />
      )}
      <div
        id="scrollableDiv"
        ref={scrollableNodeRef}
        className="list"
        style={{
          paddingTop:
            curTab && curTab.childrenList && curTab.childrenList.length > 0
              ? "95px"
              : "47px",
          height:
            curTab && curTab.childrenList && curTab.childrenList.length > 0
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
                    showImg={showImg}
                  />
                </motion.div>
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>
      {/* 回到顶部按钮 */}
      <FloatButton.BackTop
        shape="circle"
        style={{ insetInlineEnd: 24, bottom: 24 }}
        visibilityHeight={500}
        duration={1000}
        icon={<VerticalAlignTopOutlined style={{ color: "#00a1d6" }} />}
        tooltip={{ title: "回到顶部", placement: "left" }}
        target={() => scrollableNodeRef.current || window}
      />
      {/* 刷新按钮 */}
      <FloatButton
        shape="circle"
        style={{ insetInlineEnd: 24, bottom: 84 }}
        onClick={() => {
          const key = subActiveKey || activeKey;
          clearList();
          getListData(key, true);
        }}
        icon={<RedoOutlined style={{ color: "#fb7299" }} />}
        tooltip={{ title: "刷新", placement: "left" }}
      />
      {/* 更多功能按钮组 */}
      <FloatButton.Group
        shape="circle"
        trigger="click"
        style={{ insetInlineEnd: 24, bottom: 144 }}
        icon={<AppstoreOutlined style={{ color: "#00a1d6" }} />}
        tooltip={{ title: "更多", placement: "left" }}
      >
        {/* 显示图片 */}
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
    </>
  );
}

export default App;
