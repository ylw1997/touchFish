/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-17 17:57:55
 * @LastEditTime: 2025-07-01 16:16:48
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\App.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { Divider, FloatButton, Tabs, TabsProps } from "antd";
import { vscode } from "./utils/vscode";
import { commandsType, weiboAJAX, weiboUser } from "../.././type";
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
    updateList,
    sendMessage,
    copyLink,
    contextHolder,
    messageApi,
    clearList,
    max_id,
    setMaxId,
    handleToggleComments,
    handleExpandLongWeibo,
    curItem,
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

  // 处理函数集合
  const handlers = useMemo(
    () => ({
      SENDUSERBLOG: () => {
        messageApi.destroy("GETUSERBLOG");
      },
      SENDDATA: (payload: any) => {
        messageApi.destroy("GETDATA");
        if (payload?.ok) {
          if (payload.source === APPSOURCE) {
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
              subAcitiveKey,
            });
          }
        } else {
          messageApi.error("数据请求失败!" + payload?.msg);
        }
      },
      SENDCOMMENT: (payload: any) => {
        messageApi.destroy("GETCOMMENT");
        if (payload?.ok) {
          if (payload.source === APPSOURCE) {
            const { id } = payload.payload;
            const data = payload.data;
            updateList(
              (item) => item.id === id,
              (item) => ({ ...item, comments: data })
            );
          }
        } else {
          messageApi.error("评论请求失败!" + payload?.msg);
        }
      },
      SENDCREATECOMMENTS: (payload: any) => {
        messageApi.destroy("GETCREATECOMMENTS");
        if (payload?.ok) {
          if (payload.source === APPSOURCE) {
            messageApi.success("评论成功!");
            if (curItem) {
              sendMessage(
                "GETCOMMENT",
                {
                  url: `/statuses/buildComments?flow=1&id=${curItem.id}&is_show_bulletin=2uid=${curItem.user?.id}&locale=zh-CN`,
                  id: curItem.id,
                  uid: curItem.user?.id,
                },
                "请求评论中...",
                APPSOURCE
              );
            }
          }
        } else {
          messageApi.error("评论失败!" + payload?.msg);
        }
      },
      SENDCREATEREPOST: (payload: any) => {
        messageApi.destroy("GETCREATEREPOST");
        if (payload?.ok) {
          if (payload.source === APPSOURCE) {
            messageApi.success("转发成功!");
          }
        } else {
          messageApi.error("转发失败!" + payload?.msg);
        }
      },
      SENDLONGTEXT: (payload: any) => {
        messageApi.destroy("GETLONGTEXT");
        if (payload?.ok) {
          if (payload.source === APPSOURCE) {
            const mblogid = payload.payload;
            const text = payload.data.longTextContent.replace(/\n/g, "<br/>");
            updateList(
              (item) => item.mblogid === mblogid,
              (item) => ({ ...item, text })
            );
          }
        } else {
          messageApi.error("长文本请求失败!" + payload?.msg);
        }
      },
      SENDFOLLOW: (payload: any) => {
        messageApi.destroy("GETFOLLOW");
        if (payload?.ok) {
          if (payload.source === APPSOURCE) {
            messageApi.success("关注成功!");
            if (userDetail) {
              setUserDetail((item) => {
                return {
                  ...item!,
                  following: true,
                };
              });
              updateList(
                (item) => item.user?.id === userDetail!.id,
                (item) => ({
                  ...item,
                  user: {
                    ...item.user,
                    following: true,
                  } as weiboUser,
                })
              );
            }
          }
        } else {
          messageApi.error("关注请求失败!" + payload?.msg);
        }
      },
      SENTNEWBLOGRESULT: (payload: any) => {
        messageApi.destroy("GETNEWBLOGRESULT");
        setSendLoading(false);
        if (payload?.ok) {
          if (payload.source === APPSOURCE) {
            messageApi.success("微博发送成功!");
            setList((list) => [payload.data, ...list]);
            setSendDrawerOpen(false);
          }
        } else {
          messageApi.error("微博发送失败!" + payload?.msg);
        }
      },
      SENDCANCELFOLLOW: (payload: any) => {
        messageApi.destroy("GETCANCELFOLLOW");
        if (payload?.ok) {
          if (payload.source === APPSOURCE) {
            messageApi.success("取消关注成功!");
            if (userDetail) {
              setUserDetail((item) => {
                return {
                  ...item!,
                  following: false,
                };
              });
              updateList(
                (item) => item.user?.id === userDetail!.id,
                (item) => ({
                  ...item,
                  user: {
                    ...item.user,
                    following: false,
                  } as weiboUser,
                })
              );
            }
          }
        } else {
          messageApi.error("取消关注请求失败!" + payload?.msg);
        }
      },
      SENDSETLIKE: (payload: any) => {
        messageApi.destroy("GETSETLIKE");
        console.log("SENDSETLIKE", payload);
        if (payload?.ok) {
          if (payload.source === APPSOURCE) {
            messageApi.success("点赞成功!");
            if (!curItem) return;
            updateList(
              (item) => item.id === curItem.id,
              (item) => ({
                ...item,
                attitudes_status: 1,
                attitudes_count: item.attitudes_count + 1,
              })
            );
          }
        } else {
          messageApi.error("点赞失败!" + payload?.msg);
        }
      },
      SENDCANCELLIKE: (payload: any) => {
        messageApi.destroy("GETCANCELLIKE");
        if (payload?.ok) {
          if (payload.source === APPSOURCE) {
            messageApi.success("取消点赞成功!");
            if (!curItem) return;
            updateList(
              (item) => item.id === curItem.id,
              (item) => ({
                ...item,
                attitudes_status: 0,
                attitudes_count: item.attitudes_count - 1,
              })
            );
          }
        } else {
          messageApi.error("取消点赞失败!" + payload?.msg);
        }
      },
    }),
    [
      messageApi,
      list,
      setList,
      setTotal,
      setMaxId,
      activeKey,
      subAcitiveKey,
      updateList,
      curItem,
      sendMessage,
      userDetail,
      setUserDetail,
      setSendLoading,
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
