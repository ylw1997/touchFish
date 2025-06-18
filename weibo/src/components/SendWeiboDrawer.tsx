/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-18 15:57:18
 * @LastEditTime: 2025-06-18 17:45:43
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\components\SendWeiboDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import React, { useState } from "react";
import { Drawer, Button, Input } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useVscodeMessage } from "../hooks/useVscodeMessage";

interface SendWeiboDrawerProps {
  open: boolean;
  onClose: () => void;
  onSend: (content: string) => void;
  loading?: boolean;
}

const { TextArea } = Input;

const SendWeiboDrawer: React.FC<SendWeiboDrawerProps> = ({
  open,
  onClose,
  onSend,
  loading = false,
}) => {
  const [content, setContent] = useState("");
  const { messageApi } = useVscodeMessage();

  const handleSend = () => {
    if (!content.trim()) {
      messageApi.warning("请输入内容");
      return;
    }
    onSend(content);
    setContent("");
  };

  return (
    <Drawer
      title="发送微博"
      placement="top"
      height={220}
      open={open}
      onClose={onClose}
      mask={false}
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
          padding: '10px',
        },
        content: {
          background: "rgba(26, 28, 34, 0.5)",
          backdropFilter: "saturate(180%) blur(15px)",
        },
      }}
    >
      <TextArea
        rows={4}
        maxLength={280}
        showCount
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="此刻你想说点什么..."
        disabled={loading}
        style={{ background:'#14141482' }}
      />
    </Drawer>
  );
};

export default SendWeiboDrawer;
