/*
 * @Author: yangliwei 1280426581@qq.com
 * @Date: 2024-11-18 11:49:59
 * @LastEditTime: 2024-11-19 17:51:29
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\App.tsx
 * Copyright (c) 2024 by yangliwei, All Rights Reserved.
 * @Description:
 */

import { useEffect, useState } from "react";
import { Avatar, Button, Card, message, Space } from "antd";
import { vscode } from "./utils/vscode";
import { commandsType, weiboAJAX, weiboItem } from "../.././type";
import "./style/index.less";
import YImg from "./components/YImg";
// import data from "./a.json";
function App() {
  const [list, setList] = useState<weiboItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    postmsg();
  }, []);

  const postmsg = () => {
    setList([]);
    const message: commandsType<string> = {
      command: "GETDATA",
      payload: "通过VSCODE获取微博数据",
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

  return (
    <>
      <Button type="primary" loading={loading} onClick={postmsg}>
        刷新
      </Button>
      <div className="list">
        <Space direction="vertical">
          {list?.map((item) => {
            return (
              <Card
                key={item.id}
                title={
                  <Space>
                    <Avatar src={<YImg src={item.user.avatar_large} />} />
                    <span>{item.user.screen_name}</span>
                  </Space>
                }
                hoverable
              >
                <div
                  className="content"
                  dangerouslySetInnerHTML={{ __html: item.text }}
                ></div>
              </Card>
            );
          })}
        </Space>
      </div>
    </>
  );
}

export default App;
