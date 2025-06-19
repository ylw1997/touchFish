/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-18 15:57:18
 * @LastEditTime: 2025-06-19 16:19:13
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\components\SendWeiboDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import React from "react";
import { Drawer, Button, Input, Form, Select } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import { weiboSendParams } from "../types";

interface SendWeiboDrawerProps {
  open: boolean;
  onClose: () => void;
  onSend: (content: weiboSendParams) => void;
  loading?: boolean;
}

const { TextArea } = Input;
const { Option } = Select;

const visibleOptions = [
  { label: "公开", value: 0 },
  { label: "自己", value: 1 },
  { label: "好友圈", value: 6 },
  { label: "粉丝", value: 10 },
];

const SendWeiboDrawer: React.FC<SendWeiboDrawerProps> = ({
  open,
  onClose,
  onSend,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const { messageApi, contextHolder } = useVscodeMessage();

  const handleSend = () => {
    form
      .validateFields()
      .then((values) => {
        onSend({
          content: values.content,
          visible: values.visible,
          vote: "",
          media: "",
        });
        form.resetFields();
      })
      .catch(() => {
        messageApi.warning("请填写完整信息");
      });
  };

  return (
    <>
      {contextHolder}
      <Drawer
        title="发送微博"
        placement="top"
        height={'auto'}
        open={open}
        onClose={() => {
          onClose();
          form.resetFields();
        }}
        destroyOnClose
        extra={
          <Button
            icon={<SendOutlined />}
            loading={loading}
            onClick={handleSend}
            variant="filled"
            color="default"
          >
            发送
          </Button>
        }
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
        <Form form={form} layout="vertical" initialValues={{ visible: 0 }}>
          <Form.Item
            label="微博正文"
            name="content"
            rules={[{ required: true, message: "请输入微博内容" }]}
          >
            <TextArea
              rows={4}
              maxLength={280}
              showCount
              placeholder="此刻你想说点什么..."
              disabled={loading}
              style={{ background: "#14141482" }}
            />
          </Form.Item>
          <Form.Item
            label="对谁可见"
            name="visible"
            rules={[{ required: true, message: "请选择可见范围" }]}
          >
            <Select disabled={loading}>
              {visibleOptions.map((opt) => (
                <Option value={opt.value} key={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default SendWeiboDrawer;
