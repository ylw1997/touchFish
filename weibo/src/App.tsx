/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-18 11:49:59
 * @LastEditTime: 2025-03-06 16:27:43
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\App.tsx
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */

import { useEffect, useState } from "react";
import {
  Avatar,
  Card,
  Divider,
  Flex,
  FloatButton,
  Image,
  message,
  Skeleton,
  Space,
  Tabs,
} from "antd";
import { vscode } from "./utils/vscode";
import { commandsType, weiboAJAX, weiboItem } from "../.././type";
import "./style/index.less";
import YImg from "./components/YImg";
import {
  HeartOutlined,
  MessageOutlined,
  RedoOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
// import data from "./a.json";
import InfiniteScroll from "react-infinite-scroll-component";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import _relativeTime from "dayjs/plugin/relativeTime";
import { renderComments } from "./components/Comment";
dayjs.locale("zh-cn");
dayjs.extend(_relativeTime);

const defTab = [
  {
    key: "/unreadfriendstimeline?list_id=100017515513422",
    label: "全部",
  },
  {
    key: "/friendstimeline?list_id=110007515513422",
    label: "最新",
  },
  {
    key: "/groupstimeline?list_id=4563498095349254",
    label: "特别",
  },
  {
    key: "/groupstimeline?list_id=100097515513422",
    label: "好友",
  },
  {
    key:"/hottimeline?group_id=102803&containerid=102803&extparam=discover%7Cnew_feed",
    label: "热门",
  },
];

function App() {
  // const [list, setList] = useState<weiboItem[]>(data as any);
  const [list, setList] = useState<weiboItem[]>([]);
  const [tabs] = useState(defTab);
  const [loading, setLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(defTab[0].key);
  const [total, setTotal] = useState(0);
  // 下次请求开始id
  const [max_id, setMaxId] = useState<number>();

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const res = vscode.getState() as any;
    if (res) {
      console.log("缓存", res);
      if (res.activeKey) {
        setActiveKey(res.activeKey);
      }
      if (res.list) {
        setList(res.list);
      }
      if (res.max_id) {
        setMaxId(res.max_id);
      }
      if (res.total) {
        setTotal(res.total);
      }
    } else {
      postmsg();
    }
  }, []);

  window.onmessage = (ev: MessageEvent<commandsType<weiboAJAX>>) => {
    if (ev.type == "message") {
      const msg = ev.data;
      switch (msg.command) {
        case "SENDDATA": {
          setLoading(false);
          messageApi.destroy("GETDATA");
          if (msg.payload) {
            if (msg.payload.ok) {
              const wlist = [...list, ...msg.payload.statuses];
              setList(wlist);
              const wtotal = msg.payload.total_number
                ? msg.payload.total_number
                : 999;
              setTotal(wtotal);
              setMaxId(msg.payload.max_id);
              vscode.setState({
                list: wlist,
                max_id: msg.payload.max_id,
                total: wtotal,
                activeKey,
              });
            } else {
              message.error("数据请求失败!", msg.payload.ok);
            }
          }
          break;
        }
        case "SENDCOMMENT": {
          messageApi.destroy("GETCOMMENT");
          setCommitLoading(false);
          if (msg.payload) {
            if (msg.payload.ok) {
              console.log("SENDCOMMENT", msg.payload);
              const { id } = (msg.payload as any).payload;
              const data = msg.payload.data;
              // 根据id在list中找到对应的item
              setList(
                list.map((item) => {
                  if (item.id === id) {
                    return {
                      ...item,
                      comments: data,
                    };
                  }
                  return item;
                })
              );
            } else {
              message.error("数据请求失败!", msg.payload.ok);
            }
          }
          break;
        }
      }
    }
  };

  // 请求数据
  const postmsg = () => {
    if (loading) {
      return;
    }
    setLoading(true);
    messageApi.open({
      key: "GETDATA",
      type: "loading",
      content: "加载中...",
      duration: 0,
    });
    const message: commandsType<string> = {
      command: "GETDATA",
      // 确认有值,并且不是全部关注,全部关注没有max_id
      payload:
        max_id && activeKey != defTab[0].key
          ? `${activeKey}&max_id=${max_id}`
          : activeKey,
    };
    vscode.postMessage(message);
  };

  // 请求评论
  const getComments = (id: number, uid: number) => {
    // 如果有评论就去掉,如果没有就请求
    const citem = list.find((item) => item.id === id);
    if (citem?.comments) {
      // 去掉评论
      setList(
        list.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              comments: undefined,
            };
          }
          return item;
        })
      );
      return;
    }
    
    if (commitLoading) {
      return;
    }
    setCommitLoading(true);
    messageApi.open({
      key: "GETCOMMENT",
      type: "loading",
      content: "加载中...",
      duration: 0,
    });
    const message: commandsType<{ url: string; id: number; uid: number }> = {
      command: "GETCOMMENT",
      payload: {
        url: `/statuses/buildComments?id=${id}&is_show_bulletin=2uid=${uid}&locale=zh-CN`,
        id,
        uid,
      },
    };
    vscode.postMessage(message);
  };

  // 清空
  const clear = () => {
    setList([]);
    setMaxId(undefined);
    setTotal(0);
  };

  // 切换
  const onChange = (key: string) => {
    clear();
    setActiveKey(key);
    const message: commandsType<string> = {
      command: "GETDATA",
      payload: key,
    };
    vscode.postMessage(message);
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
      ></Tabs>
      <div className="list">
        <InfiniteScroll
          dataLength={list.length}
          next={postmsg}
          loader={
            <Card>
              <Skeleton avatar paragraph={{ rows: 1 }} active />
            </Card>
          }
          endMessage={<Divider plain>没有了🤐</Divider>}
          hasMore={list.length < total}
        >
          {list?.map((item) => {
            return (
              <Card
                key={item.id}
                title={
                  <Flex justify="space-between" align="center">
                    <Space>
                      <Avatar
                        src={<YImg useImg src={item.user.avatar_large} />}
                      />
                      <div>
                        <span>{item.user.screen_name}</span>
                        <div className="info">
                      <span>{dayjs(item.created_at).fromNow()}</span>{" "}
                      <span>{item.region_name?.replace("发布于", "")}</span>
                    </div>
                      </div>
                    </Space>
                  </Flex>
                }
              >
                <div
                  className="content"
                  dangerouslySetInnerHTML={{ __html: item.text }}
                ></div>
                <div className="imglist">
                  <Image.PreviewGroup>
                    {item.pic_ids &&
                      item.pic_infos &&
                      item.pic_ids.map((pic: string) => {
                        return (
                          item.pic_infos[pic] && (
                            <YImg
                              width={item.pic_ids.length>1? 160:undefined}
                              height={item.pic_ids.length>1? 160:undefined}
                              className="img-item"
                              key={pic}
                              src={
                                item.pic_infos[pic].large
                                  ? item.pic_infos[pic].large.url
                                  : item.pic_infos[pic].bmiddle.url
                              }
                            />
                          )
                        );
                      })}
                  </Image.PreviewGroup>
                </div>
                <div className="info mt10">
                  <Flex justify="space-around" align="center">
                    <span className="link">
                      <ShareAltOutlined /> {item.reposts_count}
                    </span>
                    <span
                      className="link"
                      onClick={() => getComments(item.id, item.user.id)}
                    >
                      <MessageOutlined /> {item.comments_count}
                    </span>
                    <span className="link">
                      <HeartOutlined /> {item.attitudes_count}
                    </span>
                  </Flex>
                </div>
                {/* 查看评论 */}
                {item.comments && (
                  <>
                    <Divider />
                    {renderComments(item.comments)}
                  </>
                )}
              </Card>
            );
          })}
        </InfiniteScroll>
      </div>
      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24 }}>
        <FloatButton.BackTop type="primary" visibilityHeight={0} />
        <FloatButton
          onClick={() => {
            clear();
            postmsg();
          }}
          type="primary"
          icon={<RedoOutlined />}
        />
      </FloatButton.Group>
    </>
  );
}

export default App;
