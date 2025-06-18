/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-17 17:57:55
 * @LastEditTime: 2025-06-18 14:39:27
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\App.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Divider,
  FloatButton,
  message,
  Tabs,
  Drawer,
  Avatar,
} from "antd";
import { vscode } from "./utils/vscode";
import {
  CommandList,
  commandsType,
  weiboAJAX,
  weiboItem,
  weiboUser,
} from "../.././type";
import "./style/index.less";
import { RedoOutlined } from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import _relativeTime from "dayjs/plugin/relativeTime";
import WeiboCard from "./components/WeiboCard";
import YImg from "./components/YImg";
import { updateWeiboList } from "./utils/updateWeiboList";
import { loaderFunc } from "./utils/loader";
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
  const [tabs] = useState(defTab);
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(defTab[0].key);
  const [total, setTotal] = useState(0);
  const [max_id, setMaxId] = useState<number>();
  const [userWeiboPage, setUserWeiboPage] = useState<number>(0);
  const [curBlogId, setCurBlogId] = useState<number>();
  const [messageApi, contextHolder] = message.useMessage();
  const [userDetailVisible, setUserDetailVisible] = useState(false);
  const [userDetail, setUserDetail] = useState<weiboUser>();
  const [userWeiboList, setUserWeiboList] = useState<weiboItem[]>([]);

  // 通用更新list工具（直接用updateWeiboList实现）
  const updateList = useCallback(
    (
      matcher: (item: weiboItem) => boolean,
      updater: (item: weiboItem) => weiboItem
    ) => {
      setList((list) => updateWeiboList(list, matcher, updater));
    },
    []
  );

  // 针对userWeiboList的更新工具
  const updateUserWeiboList = useCallback(
    (
      matcher: (item: weiboItem) => boolean,
      updater: (item: weiboItem) => weiboItem
    ) => {
      setUserWeiboList((list) => updateWeiboList(list, matcher, updater));
    },
    []
  );

  // 统一发送消息
  const sendMessage = useCallback(
    (command: CommandList, payload: any) => {
      console.log("sendMessage", command, payload);
      messageApi.open({
        key: command,
        type: "loading",
        content: "加载中...",
        duration: 0,
      });
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
          vscode.setState({
            list: wlist,
            max_id: payload.max_id,
            total: wtotal,
            activeKey,
          });
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
          // 判断当前是主列表还是用户微博列表
          if (userDetailVisible) {
            updateUserWeiboList(
              (item) => item.id === id,
              (item) => ({ ...item, comments: data })
            );
          } else {
            updateList(
              (item) => item.id === id,
              (item) => ({ ...item, comments: data })
            );
          }
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
          if (userDetailVisible) {
            updateUserWeiboList(
              (item) => item.mblogid === mblogid,
              (item) => ({ ...item, text })
            );
          } else {
            updateList(
              (item) => item.mblogid === mblogid,
              (item) => ({ ...item, text })
            );
          }
        } else {
          messageApi.error("长文本请求失败!", payload?.ok);
        }
      },
      SENDUSERBLOG: (payload: any) => {
        messageApi.destroy("GETUSERBLOG");
        setLoading(false);
        if (payload?.ok) {
          const wlist = [...userWeiboList, ...payload.data.list];
          const wtotal = payload.data?.total ?? 999;
          setUserWeiboList(wlist);
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
            updateList(
              (item) => item.id === curBlogId,
              (item) => ({ ...item, followBtnCode: undefined })
            );
          }
        } else {
          messageApi.error("关注请求失败!", payload?.ok);
        }
      },
    }),
    [
      list,
      activeKey,
      curBlogId,
      messageApi,
      updateList,
      userWeiboList,
      updateUserWeiboList,
      userDetailVisible,
    ]
  );

  // 统一处理消息响应
  useEffect(() => {
    const handler = (ev: MessageEvent<commandsType<weiboAJAX>>) => {
      if (ev.type !== "message") return;
      const msg = ev.data;
      const fn = (handlers as Record<string, (payload: any) => void>)[
        msg.command as string
      ];
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
    const payload =
      max_id && activeKey !== defTab[0].key
        ? `${activeKey}&max_id=${max_id}`
        : activeKey;
    sendMessage("GETDATA", payload);
  }, [loading, activeKey, max_id, sendMessage]);

  // 清空列表
  const clearList = useCallback(() => {
    setList([]);
    setMaxId(undefined);
    setTotal(0);
  }, []);

  // 合并评论展开/收起方法，支持主列表和用户微博列表
  const handleToggleComments = useCallback(
    (id: number, uid: number, is_retweeted: boolean, isUserBlog = false) => {
      const targetList = isUserBlog ? userWeiboList : list;
      const updateTargetList = isUserBlog ? updateUserWeiboList : updateList;
      const citem = targetList.find(
        (item) => item.id === id || item.retweeted_status?.id === id
      );
      if (citem?.comments && !is_retweeted) {
        updateTargetList(
          (item) => item.id === id,
          (item) => ({ ...item, comments: undefined })
        );
        return;
      }
      if (is_retweeted && citem?.retweeted_status?.comments) {
        updateTargetList(
          (item) => item.retweeted_status?.id === id,
          (item) => ({
            ...item,
            retweeted_status: {
              ...item.retweeted_status!,
              comments: undefined,
            },
          })
        );
        return;
      }
      if (loading) return;
      setLoading(true);
      sendMessage("GETCOMMENT", {
        url: `/statuses/buildComments?id=${id}&is_show_bulletin=2uid=${uid}&locale=zh-CN`,
        id,
        uid,
      });
    },
    [userWeiboList, list, loading, sendMessage, updateUserWeiboList, updateList]
  );

  // 合并长微博展开方法，支持主列表和用户微博列表
  const handleExpandLongWeibo = useCallback(
    (id: string) => {
      if (loading) return;
      setLoading(true);
      sendMessage("GETLONGTEXT", id);
    },
    [loading, sendMessage]
  );

  // 查看博主微博
  const getUserBlog = useCallback(
    (userInfo: weiboUser) => {
      if (loading) return;
      setUserDetail(userInfo);
      setUserDetailVisible(true);
      setUserWeiboPage(1);
      setUserWeiboList([]); // 新增：清空用户微博列表
      setLoading(true);
      sendMessage("GETUSERBLOG", JSON.stringify({ uid: userInfo.id, page: 1 }));
    },
    [loading, sendMessage]
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
      setActiveKey(key);
      sendMessage("GETDATA", key);
    },
    [clearList, sendMessage]
  );

  const getUserBlogFunc = () => {
    if (!loading && userDetail)
      sendMessage(
        "GETUSERBLOG",
        JSON.stringify({
          uid: userDetail.id,
          page: userWeiboPage + 1,
        })
      );
  };
  
  return (
    <>
      {contextHolder}
      <Drawer
        closable
        open={userDetailVisible}
        onClose={() => {
          setUserDetailVisible(false);
          setUserWeiboList([]);
          setUserDetail(undefined);
        }}
        title={userDetail?.screen_name}
        placement="bottom"
        height="calc(100vh - 200px)"
        styles={{
          wrapper: {
            background: "none",
            borderRadius: "10px",
            overflow: "hidden",
          },
          body: {
            padding: 0,
            height: "100%",
            minHeight: 0,
            overflow: "auto",
          },
          content: {
            background: "rgba(26, 28, 34, 0.5)",
            backdropFilter: "saturate(180%) blur(15px)",
          },
        }}
      >
        {userDetail && (
          <div
            id="user-blog"
            style={{
              height: "100%",
              minHeight: 0,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <Avatar
                size={80}
                style={{ marginTop: 16 }}
                src={<YImg useImg src={userDetail.avatar_large} />}
              />
              <div style={{ fontSize: 20, fontWeight: 500 }}>
                {userDetail.screen_name}
              </div>
            </div>
            <div style={{ width: "100%", marginTop: 24 }}>
              <InfiniteScroll
                scrollableTarget="user-blog"
                dataLength={userWeiboList.length}
                next={getUserBlogFunc}
                loader={loaderFunc()}
                endMessage={<Divider plain>没有了🤐</Divider>}
                hasMore={userWeiboList.length < total}
              >
                {userWeiboList.map((item) => (
                  <WeiboCard
                    key={item.id}
                    item={item}
                    activeKey={"userblog"}
                    onUserClick={getUserBlog}
                    onFollow={followUser}
                    onExpandLongWeibo={handleExpandLongWeibo}
                    onToggleComments={(id, uid, is_retweeted) =>
                      handleToggleComments(id, uid, is_retweeted, true)
                    }
                  />
                ))}
              </InfiniteScroll>
            </div>
          </div>
        )}
      </Drawer>
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
          loader={loaderFunc(1)}
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
              onExpandLongWeibo={handleExpandLongWeibo}
              onToggleComments={handleToggleComments}
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
