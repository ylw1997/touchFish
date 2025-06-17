/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-18 11:49:59
 * @LastEditTime: 2025-06-17 10:16:57
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\App.tsx
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description: 微博主页面，包含微博列表、评论、关注、长微博等功能
 */

import { useEffect, useState } from "react";
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
  const [commitLoading, setCommitLoading] = useState(false);
  const [longTextLoading, setLongTextLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(defTab[0].key);
  const [total, setTotal] = useState(0);
  const [max_id, setMaxId] = useState<number>();
  const [curUserId, setCurUserId] = useState<number>();
  const [userWeiboPage, setUserWeiboPage] = useState<number>(1);
  const [curBlogId, setCurBlogId] = useState<number>();
  const [messageApi, contextHolder] = message.useMessage();
  // 保存查看用户微博前的tab和list
  const [prevTabs, setPrevTabs] = useState<string>("");
  const [prevList, setPrevList] = useState<weiboItem[]>([]);
  const [scrollTop, setScrollTop] = useState<number>(0);

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

  // 统一处理消息响应
  window.onmessage = (ev: MessageEvent<commandsType<weiboAJAX>>) => {
    if (ev.type !== "message") return;
    const msg = ev.data;
    
    switch (msg.command as CommandList) {
      case "SENDDATA":
        handleSendData(msg.payload);
        break;
      case "SENDCOMMENT":
        handleSendComment(msg.payload);
        break;
      case "SENDLONGTEXT":
        handleSendLongText(msg.payload);
        break;
      case "SENDUSERBLOG":
        handleSendUserBlog(msg.payload);
        break;
      case "SENDFOLLOW":
        handleSendFollow(msg.payload);
        break;
      default:
        break;
    }
  };

  // 处理数据请求响应
  const handleSendData = (payload: any) => {
    setLoading(false);
    messageApi.destroy("GETDATA");
    if (payload?.ok) {
      const wlist = [...list, ...payload.statuses];
      const wtotal = payload.total_number ?? 999;
      setList(wlist);
      setTotal(wtotal);
      setMaxId(payload.max_id);
      vscode.setState({
        list: wlist,
        max_id: payload.max_id,
        total: wtotal,
        activeKey,
      });
    } else {
      messageApi.error("数据请求失败!", payload?.ok);
    }
  };

  // 处理评论响应
  const handleSendComment = (payload: any) => {
    messageApi.destroy("GETCOMMENT");
    setCommitLoading(false);
    if (payload?.ok) {
      const { id } = (payload as any).payload;
      const data = payload.data;
      setList(
        list.map((item) => {
          if (item.id === id) {
            return { ...item, comments: data };
          } else {
            const retweeted_status = item.retweeted_status;
            if (retweeted_status && retweeted_status.id === id) {
              return {
                ...item,
                retweeted_status: { ...retweeted_status, comments: data },
              };
            } else {
              return item;
            }
          }
        })
      );
    } else {
      messageApi.error("评论请求失败!", payload?.ok);
    }
  };

  // 处理长文本响应
  const handleSendLongText = (payload: any) => {
    messageApi.destroy("GETLONGTEXT");
    setLongTextLoading(false);
    if (payload?.ok) {
      const mblogid = (payload as any).payload;
      const text = (payload as any).data.longTextContent.replace(
        /\n/g,
        "<br/>"
      );
      setList(
        list.map((item) => {
          if (item.mblogid === mblogid) {
            return { ...item, text };
          } else {
            const retweeted_status = item.retweeted_status;
            if (retweeted_status && retweeted_status.mblogid === mblogid) {
              return {
                ...item,
                retweeted_status: { ...retweeted_status, text },
              };
            } else {
              return item;
            }
          }
        })
      );
    } else {
      messageApi.error("长文本请求失败!", payload?.ok);
    }
  };

  // 处理用户微博响应
  const handleSendUserBlog = (payload: any) => {
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
  };

  // 处理关注响应
  const handleSendFollow = (payload: any) => {
    messageApi.destroy("GETFOLLOW");
    setFollowLoading(false);
    if (payload?.ok) {
      messageApi.success("关注成功!");
      if (curBlogId) {
        setList(
          list.map((item) =>
            item.id === curBlogId
              ? { ...item, followBtnCode: undefined }
              : item
          )
        );
      }
    } else {
      messageApi.error("关注请求失败!", payload?.ok);
    }
  };

  // 请求数据（主列表/用户微博）
  const fetchData = () => {
    if (loading) return;
    setLoading(true);
    if (activeKey === "userblog") {
      // 用户微博分页
      const page = userWeiboPage + 1;
      setUserWeiboPage(page);
      sendMessage("GETUSERBLOG", JSON.stringify({ uid: curUserId, page }));
    } else {
      // 普通tab
      const payload =
        max_id && activeKey !== defTab[0].key
          ? `${activeKey}&max_id=${max_id}`
          : activeKey;
      sendMessage("GETDATA", payload);
    }
  };

  // 统一发送消息
  const sendMessage = (command: CommandList, payload: any) => {
    messageApi.open({
      key: command,
      type: "loading",
      content: "加载中...",
      duration: 0,
    });
    const message: commandsType<any> = { command, payload };
    vscode.postMessage(message);
  };

  // 评论展开/收起
  const toggleComments = (id: number, uid: number) => {
    const citem = list.find((item) => item.id === id);
    if (citem?.comments) {
      setList(
        list.map((item) =>
          item.id === id ? { ...item, comments: undefined } : item
        )
      );
      return;
    }
    if (commitLoading) return;
    setCommitLoading(true);
    sendMessage("GETCOMMENT", {
      url: `/statuses/buildComments?id=${id}&is_show_bulletin=2uid=${uid}&locale=zh-CN`,
      id,
      uid,
    });
  };

  // 展开长微博
  const expandLongWeibo = (id: string) => {
    if (longTextLoading) return;
    setLongTextLoading(true);
    sendMessage("GETLONGTEXT", id);
  };

  // 查看博主微博
  const getUserBlog = (screen_name: string, id: number) => {
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
  };

  // 关注博主
  const followUser = (uid: string, blogId: number) => {
    if (followLoading) return;
    setFollowLoading(true);
    setCurBlogId(blogId);
    sendMessage("GETFOLLOW", uid);
  };

  // 清空列表
  const clearList = () => {
    setList([]);
    setMaxId(undefined);
    setTotal(0);
  };

  // tab切换
  const onChange = (key: string) => {
    clearList();
    if (key !== "userblog") {
      setActiveKey(key);
      if (tabs.findIndex((item) => item.key === "userblog") !== -1) {
        setTabs(defTab);
        setUserWeiboPage(1);
        document.documentElement.scrollTop = scrollTop;
      }
      // 如果和前一个tab一致就不重复请求
      if (key === prevTabs) {
        setList(prevList);
        setPrevList([]);
        setPrevTabs("");
        return;
      }
      sendMessage("GETDATA", key);
    }
  };

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
