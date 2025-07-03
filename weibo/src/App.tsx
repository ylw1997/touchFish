/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-17 17:57:55
 * @LastEditTime: 2025-07-03 16:38:31
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\App.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { Divider, FloatButton, Tabs, TabsProps } from "antd";
import { vscode } from "./utils/vscode";
import "./style/index.less";
import {
  EditOutlined,
  RedoOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import _relativeTime from "dayjs/plugin/relativeTime";
import WeiboCard from "./components/WeiboCard";
import { loaderFunc } from "./utils/loader";
import SendWeiboDrawer from "./components/SendWeiboDrawer";
import UserDetailDrawer from "./components/UserDetailDrawer";
import { defTab } from "./data/tabs";
import useWeiboAction from "./hooks/useWeiboAction";
dayjs.locale("zh-cn");
dayjs.extend(_relativeTime);

function App() {
  const APPSOURCE = "WEIBOAPP";
  const {
    list,
    setList,
    total,
    setTotal,
    copyLink,
    contextHolder,
    messageApi,
    clearList,
    max_id,
    setMaxId,
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
  } = useWeiboAction(APPSOURCE);
  // 状态管理
  const [tabs] = useState(defTab);
  const [activeKey, setActiveKey] = useState(defTab[0].key);
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false);
  // 子菜单key
  const [subAcitiveKey, setSubActiveKey] = useState("");

  // 初始化，尝试从缓存恢复
  useEffect(() => {
    const res = vscode.getState() as any;
    if (res) {
      if (res.activeKey) setActiveKey(res.activeKey);
      if (res.list) setList(res.list);
      if (res.max_id) setMaxId(res.max_id);
      if (res.total) setTotal(res.total);
      if (res.subAcitiveKey) setSubActiveKey(res.subAcitiveKey);
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 请求数据（主列表/用户微博）
  const fetchData = useCallback(() => {
    const key = subAcitiveKey || activeKey;
    const payload =
      max_id && key !== defTab[0].key ? `${key}&max_id=${max_id}` : key;
    getListData(payload);
  }, [subAcitiveKey, activeKey, max_id, getListData]);

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

  // tab切换
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
      <UserDetailDrawer
        visible={userDetailVisible}
        userDetail={userDetail}
        onClose={() => {
          setUserDetailVisible(false);
          setUserDetail(undefined);
        }}
        setUserDetail={setUserDetail}
        source="userDetail"
      />
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
        className="list"
        style={{
          marginTop: curTab && curTab.childrenList ? "100px" : "50px",
        }}
      >
        <InfiniteScroll
          dataLength={list.length}
          next={fetchData}
          loader={loaderFunc(1)}
          endMessage={<Divider plain>没有了🤐</Divider>}
          hasMore={list.length < total}
        >
          {list?.map((item) => (
            <WeiboCard
              key={item.id}
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
            />
          ))}
        </InfiniteScroll>
      </div>
      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
        <FloatButton.BackTop
          visibilityHeight={500}
          duration={1000}
          icon={<VerticalAlignTopOutlined style={{ color: "#f37fb7" }} />}
        />
        <FloatButton
          type="primary"
          icon={<EditOutlined style={{ color: "#69b1ff" }} />}
          onClick={() => setSendDrawerOpen((open) => !open)}
        />
        <FloatButton
          onClick={() => {
            clearList();
            fetchData();
          }}
          icon={<RedoOutlined style={{ color: "#f3cc62" }} />}
        />
      </FloatButton.Group>
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
    </>
  );
}

export default App;
