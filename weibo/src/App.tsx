/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-18 11:49:59
 * @LastEditTime: 2024-11-21 11:35:09
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\App.tsx
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */

import { useEffect, useState } from "react";
import { Avatar, Card, FloatButton, Image, message, Space, Spin, Tabs } from "antd";
import { vscode } from "./utils/vscode";
import { commandsType, weiboAJAX, weiboItem } from "../.././type";
import "./style/index.less";
import YImg from "./components/YImg";
import { RedoOutlined } from "@ant-design/icons";
// import data from "./a.json";

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
  const [list, setList] = useState<weiboItem[]>();
  const [loading, setLoading] = useState(false);
  const [tabs] = useState(defTab)
  const [activeKey,setActiveKey] = useState(defTab[0].key);

  useEffect(() => {
    postmsg();
  }, []);

  const postmsg = () => {
    const message: commandsType<string> = {
      command: "GETDATA",
      payload: activeKey,
    };
    vscode.postMessage(message);
    setLoading(true);
  };

  window.addEventListener(
    "message",
    async (event: MessageEvent<commandsType<weiboAJAX>>) => {
      const msg = event.data;
      switch (msg.command) {
        case "SENDDATA": {
          if (msg.payload) {
            if (msg.payload.ok) {
              setList(msg.payload.statuses);
            } else {
              message.error("数据请求失败!", msg.payload.ok);
            }
          }
          setLoading(false);
          break;
        }
      }
    }
  );

  // 切换
  const onChange = (key: string) => {
    console.log(key);
    setActiveKey(key);
    setLoading(true);
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
      <Tabs
        items={tabs}
        activeKey={activeKey}
        onChange={onChange}
        centered
      ></Tabs>
      <Spin spinning={loading}>
        <div className="list">
          <Space direction="vertical">
            {list?.map((item) => {
              return (
                <Card
                  key={item.id}
                  title={
                    <Space>
                      <Avatar
                        src={<YImg useImg src={item.user.avatar_large} />}
                      />
                      <span>{item.user.screen_name}</span>
                    </Space>
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
                              src={item.pic_infos[pic].large.url}
                            />
                          );
                        })}
                    </Image.PreviewGroup>
                  </div>
                </Card>
              );
            })}
          </Space>
        </div>
      </Spin>
      <FloatButton onClick={postmsg} icon={<RedoOutlined />} />
    </>
  );
}

export default App;
