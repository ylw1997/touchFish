/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-18 11:49:59
 * @LastEditTime: 2025-06-17 11:27:01
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\App.tsx
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description: 微博主页面，包含微博列表、评论、关注、长微博等功能
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, Divider, FloatButton, message, Skeleton, Tabs } from "antd";
import { vscode } from "./utils/vscode";
import { CommandList, commandsType, weiboAJAX, weiboItem } from "../.././type";
import "./style/index.less";
import { RedoOutlined } from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import _relativeTime from "dayjs/plugin/relativeTime";
import WeiboCard from "./components/WeiboCard";
dayjs.locale("zh-cn");
dayjs.extend(_relativeTime);

// 默认tab配置
const defTab = [
  { key: "/unreadfriendstimeline?list_id=100017515513422", label: "全部" },
  { key: "/friendstimeline?list_id=110007515513422", label: "最新" },
  { key: "/groupstimeline?list_id=4563498095349254", label: "特别" },
  { key: "/groupstimeline?list_id=100097515513422", label: "好友" },
  {
    key: "/hottimeline?group_id=102803&containerid=102803&extparam=discover%7Cnew_feed",
    label: "热门",
  },
];

function App() {
  // 状态管理
  const [list, setList] = useState<weiboItem[]>([]);
  const [tabs, setTabs] = useState(defTab);
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(defTab[0].key);
  const [total, setTotal] = useState(0);
  const [max_id, setMaxId] = useState<number>();
  const [curUserId, setCurUserId] = useState<number>();
  const [userWeiboPage, setUserWeiboPage] = useState<number>(1);
  const [curBlogId, setCurBlogId] = useState<number>();
  const [messageApi, contextHolder] = message.useMessage();
  const [prevTabs, setPrevTabs] = useState<string>("");
  const [prevList, setPrevList] = useState<weiboItem[]>([]);
  const [scrollTop, setScrollTop] = useState<number>(0);

  // 通用更新list工具
  const updateList = useCallback(
    (
      matcher: (item: weiboItem) => boolean,
      updater: (item: weiboItem) => weiboItem
    ) => {
      setList((list) =>
        list.map((item) => {
          if (matcher(item)) return updater(item);
          if (item.retweeted_status && matcher(item.retweeted_status as weiboItem)) {
            return { ...item, retweeted_status: updater(item.retweeted_status as weiboItem) };
          }
          return item;
        })
      );
    },
    []
  );

  // 统一发送消息
  const sendMessage = useCallback(
    (command: CommandList, payload: any) => {
      messageApi.open({ key: command, type: "loading", content: "加载中...", duration: 0 });
      vscode.postMessage({ command, payload });
    },
    [messageApi]
  );

  // 处理函数集合
  const handlers = useMemo(
    () => ({
      SENDDATA: (payload: any) => {
        setLoading(false);
        messageApi.destroy("GETDATA");
        if (payload?.ok) {
          const wlist = [...list, ...payload.statuses];
          const wtotal = payload.total_number ?? 999;
          setList(wlist);
          setTotal(wtotal);
          setMaxId(payload.max_id);
          vscode.setState({ list: wlist, max_id: payload.max_id, total: wtotal, activeKey });
        } else {
          messageApi.error("数据请求失败!", payload?.ok);
        }
      },
      SENDCOMMENT: (payload: any) => {
        messageApi.destroy("GETCOMMENT");
        setLoading(false);
        if (payload?.ok) {
          const { id } = payload.payload;
          const data = payload.data;
          updateList((item) => item.id === id, (item) => ({ ...item, comments: data }));
        } else {
          messageApi.error("评论请求失败!", payload?.ok);
        }
      },
      SENDLONGTEXT: (payload: any) => {
        messageApi.destroy("GETLONGTEXT");
        setLoading(false);
        if (payload?.ok) {
          const mblogid = payload.payload;
          const text = payload.data.longTextContent.replace(/\n/g, "<br/>");
          updateList((item) => item.mblogid === mblogid, (item) => ({ ...item, text }));
        } else {
          messageApi.error("长文本请求失败!", payload?.ok);
        }
      },
      SENDUSERBLOG: (payload: any) => {
        messageApi.destroy("GETUSERBLOG");
        setLoading(false);
        if (payload?.ok) {
          const wlist = [...list, ...payload.data.list];
          const wtotal = payload.data?.total ?? 999;
          setList(wlist);
          setTotal(wtotal);
        } else {
          messageApi.error("用户微博请求失败!", payload?.ok);
        }
      },
      SENDFOLLOW: (payload: any) => {
        messageApi.destroy("GETFOLLOW");
        setLoading(false);
        if (payload?.ok) {
          messageApi.success("关注成功!");
          if (curBlogId) {
            updateList((item) => item.id === curBlogId, (item) => ({ ...item, followBtnCode: undefined }));
          }
        } else {
          messageApi.error("关注请求失败!", payload?.ok);
        }
      },
    }),
    [list, activeKey, curBlogId, messageApi, updateList]
  );

  // 统一处理消息响应
  useEffect(() => {
    const handler = (ev: MessageEvent<commandsType<weiboAJAX>>) => {
      if (ev.type !== "message") return;
      const msg = ev.data;
      const fn = (handlers as Record<string, (payload: any) => void>)[msg.command as string];
      fn?.(msg.payload);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [handlers]);

  // 初始化，尝试从缓存恢复
  useEffect(() => {
    const res = vscode.getState() as any;
    if (res) {
      if (res.activeKey) setActiveKey(res.activeKey);
      if (res.list) setList(res.list);
      if (res.max_id) setMaxId(res.max_id);
      if (res.total) setTotal(res.total);
    } else {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 请求数据（主列表/用户微博）
  const fetchData = useCallback(() => {
    if (loading) return;
    setLoading(true);
    if (activeKey === "userblog") {
      const page = userWeiboPage + 1;
      setUserWeiboPage(page);
      sendMessage("GETUSERBLOG", JSON.stringify({ uid: curUserId, page }));
    } else {
      const payload = max_id && activeKey !== defTab[0].key ? `${activeKey}&max_id=${max_id}` : activeKey;
      sendMessage("GETDATA", payload);
    }
  }, [loading, activeKey, userWeiboPage, curUserId, max_id, sendMessage]);

  // 清空列表
  const clearList = useCallback(() => {
    setList([]);
    setMaxId(undefined);
    setTotal(0);
  }, []);

  // 评论展开/收起
  const toggleComments = useCallback(
    (id: number, uid: number) => {
      const citem = list.find((item) => item.id === id);
      if (citem?.comments) {
        updateList((item) => item.id === id, (item) => ({ ...item, comments: undefined }));
        return;
      }
      if (loading) return;
      setLoading(true);
      sendMessage("GETCOMMENT", { url: `/statuses/buildComments?id=${id}&is_show_bulletin=2uid=${uid}&locale=zh-CN`, id, uid });
    },
    [list, loading, sendMessage, updateList]
  );

  // 展开长微博
  const expandLongWeibo = useCallback(
    (id: string) => {
      if (loading) return;
      setLoading(true);
      sendMessage("GETLONGTEXT", id);
    },
    [loading, sendMessage]
  );

  // 查看博主微博
  const getUserBlog = useCallback(
    (screen_name: string, id: number) => {
      if (loading) return;
      setPrevList(list);
      setPrevTabs(activeKey);
      setScrollTop(document.documentElement.scrollTop || document.body.scrollTop);
      setCurUserId(id);
      setUserWeiboPage(1);
      setLoading(true);
      clearList();
      setTabs([...tabs, { key: `userblog`, label: `${screen_name}` }]);
      setActiveKey(`userblog`);
      sendMessage("GETUSERBLOG", JSON.stringify({ uid: id, page: 1 }));
    },
    [loading, list, activeKey, tabs, sendMessage, clearList]
  );

  // 关注博主
  const followUser = useCallback(
    (uid: string, blogId: number) => {
      if (loading) return;
      setLoading(true);
      setCurBlogId(blogId);
      sendMessage("GETFOLLOW", uid);
    },
    [loading, sendMessage]
  );

  // tab切换
  const onChange = useCallback(
    (key: string) => {
      clearList();
      if (key !== "userblog") {
        setActiveKey(key);
        if (tabs.findIndex((item) => item.key === "userblog") !== -1) {
          setTabs(defTab);
          setUserWeiboPage(1);
          document.documentElement.scrollTop = scrollTop;
        }
        if (key === prevTabs) {
          setList(prevList);
          setPrevList([]);
          setPrevTabs("");
          return;
        }
        sendMessage("GETDATA", key);
      }
    },
    [clearList, tabs, scrollTop, prevTabs, prevList, sendMessage]
  );

  return (
    <>
      {contextHolder}
      <Tabs
        className="tabs"
        items={tabs}
        activeKey={activeKey}
        onChange={onChange}
        centered
      />
      <div className="list">
        <InfiniteScroll
          dataLength={list.length}
          next={fetchData}
          loader={
            <Card>
              <Skeleton avatar paragraph={{ rows: 1 }} active />
            </Card>
          }
          endMessage={<Divider plain>没有了🤐</Divider>}
          hasMore={list.length < total}
        >
          {list?.map((item) => (
            <WeiboCard
              key={item.id}
              item={item}
              activeKey={activeKey}
              onUserClick={getUserBlog}
              onFollow={followUser}
              onExpandLongWeibo={expandLongWeibo}
              onToggleComments={toggleComments}
            />
          ))}
        </InfiniteScroll>
      </div>
      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
        <FloatButton.BackTop type="primary" visibilityHeight={0} />
        <FloatButton
          onClick={() => {
            clearList();
            fetchData();
          }}
          type="primary"
          icon={<RedoOutlined />}
        />
      </FloatButton.Group>
    </>
  );
}

export default App;
