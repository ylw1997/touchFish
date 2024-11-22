/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-18 11:49:59
 * @LastEditTime: 2024-11-22 10:42:02
 * @LastEditors: yangliwei 1280426581@qq.com
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
];

function App() {
  // const [list, setList] = useState<weiboItem[]>(data as any);
  const [list, setList] = useState<weiboItem[]>([]);
  const [tabs] = useState(defTab);
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(defTab[0].key);
  const [total, setTotal] = useState(0);
  // 下次请求开始id
  const [max_id, setMaxId] = useState<number>();

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    postmsg();
  }, []);

  // 请求数据
  const postmsg = () => {
    if (loading) {
      return;
    }
    setLoading(true);
    messageApi.open({
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

  // 接收数据
  window.addEventListener(
    "message",
    async (event: MessageEvent<commandsType<weiboAJAX>>) => {
      const msg = event.data;
      switch (msg.command) {
        case "SENDDATA": {
          setLoading(false);
          messageApi.destroy();
          if (msg.payload) {
            if (msg.payload.ok) {
              setList([...list, ...msg.payload.statuses]);
              setTotal(
                msg.payload.total_number ? msg.payload.total_number : 999
              );
              setMaxId(msg.payload.max_id);
            } else {
              message.error("数据请求失败!", msg.payload.ok);
            }
          }
          break;
        }
      }
    }
  );

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
      {/* <Button type="primary" loading={loading} onClick={postmsg}>
        刷新
      </Button> */}
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
                        size={28}
                        src={<YImg useImg src={item.user.avatar_large} />}
                      />
                      <span>{item.user.screen_name}</span>
                    </Space>
                    <Space size="middle" className="weibo-data">
                      <span>
                        <ShareAltOutlined /> {item.reposts_count}
                      </span>
                      <span>
                        <MessageOutlined /> {item.comments_count}
                      </span>
                      <span>
                        <HeartOutlined /> {item.attitudes_count}
                      </span>
                    </Space>
                  </Flex>
                }
                hoverable
              >
                <div
                  className="content"
                  dangerouslySetInnerHTML={{ __html: item.text }}
                ></div>
                <div className="imglist">
                  <Image.PreviewGroup>
                    {item.pic_ids &&
                      item.pic_ids.map((pic: string) => {
                        return (
                          <YImg
                            width={90}
                            height={90}
                            className="img-item"
                            key={pic}
                            src={
                              item.pic_infos[pic].large.url
                                ? item.pic_infos[pic].large.url
                                : item.pic_infos[pic].bmiddle.url
                            }
                          />
                        );
                      })}
                  </Image.PreviewGroup>
                </div>
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
