/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-07-23 13:59:10
 * @LastEditTime: 2025-07-25 11:07:58
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\components\SearchDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Drawer, Button, Input, Form, List, Avatar, Divider } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import { useState } from "react";
import { useMessageHandler } from "../hooks/useMessageHandler";
import YImg from "./YImg";
import { weiboUser } from "../../../type";

interface SearchDrawerProps {
  open: boolean;
  onClose: () => void;
  showUser: (userInfo: weiboUser) => void;
}

const SearchDrawer: React.FC<SearchDrawerProps> = ({
  open,
  onClose,
  showUser,
}) => {
  const [form] = Form.useForm();
  const { contextHolder, sendMessage, messageApi } = useVscodeMessage();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<weiboUser[]>([]);

  const handlers = {
    SENDSEARCH: (payload: any) => {
      messageApi.destroy("GETSEARCH");
      setLoading(false);
      if (payload.ok === 1) {
        setUsers(payload.data.users || []);
      } else {
        messageApi.error(payload.msg || "搜索失败");
      }
    },
  };

  useMessageHandler(handlers);

  const handleSearch = () => {
    form
      .validateFields()
      .then((values) => {
        setLoading(true);
        setUsers([]);
        sendMessage("GETSEARCH", values.keyword, "正在搜索...", "weibo");
      })
      .catch(() => {});
  };

  const closeFunc = () => {
    form.resetFields();
    setUsers([]);
    onClose();
  };

  return (
    <>
      {contextHolder}
      <Drawer
        title="搜索微博"
        placement="top"
        height={"auto"}
        open={open}
        onClose={closeFunc}
        destroyOnHidden
        styles={{
          wrapper: {
            background: "none",
            borderRadius: "10px",
            overflow: "hidden",
          },
          body: {
            padding: "10px",
          },
          content: {
            background: "rgba(26, 28, 34, 0.5)",
            backdropFilter: "saturate(180%) blur(15px)",
          },
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="搜索关键词,回车搜索"
            name="keyword"
            rules={[{ required: true, message: "请输入搜索关键词" }]}
          >
            <Input.Search
              placeholder="请输入搜索关键词"
              disabled={loading}
              style={{ background: "#14141482" }}
              onPressEnter={handleSearch}
              onSearch={handleSearch}
              enterButton={
                <Button
                  icon={<SearchOutlined />}
                  loading={loading}
                  type="primary"
                >
                  搜索
                </Button>
              }
            />
          </Form.Item>
        </Form>
        <Divider>相关用户</Divider>
        <List
          itemLayout="horizontal"
          dataSource={users}
          loading={loading}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    size={48}
                    src={item.avatar_hd && <YImg useImg src={item.avatar_hd} />}
                  />
                }
                title={
                  <span className={"nick-name"} onClick={() => showUser(item)}>
                    {item.screen_name}
                  </span>
                }
                description={
                  item.verified_reason ? `${item.verified_reason}` : ""
                }
              />
            </List.Item>
          )}
        />
      </Drawer>
    </>
  );
};

export default SearchDrawer;
