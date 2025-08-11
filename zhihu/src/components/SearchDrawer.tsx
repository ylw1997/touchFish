/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-11 18:00:00
 * @LastEditTime: 2025-08-11 17:34:24
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\components\SearchDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import {
  Drawer,
  Button,
  Input,
  Form,
  List,
  Empty,
  Skeleton,
  Divider,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useState, useCallback } from "react";
import { useMessageHandler } from "../hooks/useMessageHandler";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import type { ZhihuItemData } from "../../../type";
import ZhihuItem from "./ZhihuItem";

interface SearchDrawerProps {
  open: boolean;
  onClose: () => void;
  source: string;
  handleVote: (answerId: string) => void;
  openQuestionDetailDrawer: (questionId: string, title: string) => void;
}

const SearchDrawer: React.FC<SearchDrawerProps> = ({
  open,
  onClose,
  source,
  handleVote,
  openQuestionDetailDrawer,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ZhihuItemData[]>([]);
  const { sendMessage, contextHolder, messageApi } = useVscodeMessage();

  useMessageHandler({
    ZHIHU_SEND_SEARCH_RESULTS: (payload: any) => {
      messageApi.destroy("ZHIHU_SEARCH");
      setLoading(false);
      if (payload?.data && payload.source === source) {
        console.log(payload.data);
        setSearchResults(payload.data);
      } else {
        messageApi.error("搜索失败!");
      }
    },
  });

  const handleSearch = useCallback(() => {
    form
      .validateFields()
      .then((values) => {
        if (!values.keyword) return;
        setSearchResults([]);
        setLoading(true);
        sendMessage("ZHIHU_SEARCH", values.keyword, "搜索中...", source);
      })
      .catch(() => {});
  }, [form, sendMessage, source]);

  return (
    <>
      {contextHolder}
      <Drawer
        title="知乎搜索"
        placement="bottom"
        height={"90vh"}
        open={open}
        onClose={onClose}
        destroyOnHidden
        styles={{
          wrapper: {
            background: "none",
            borderRadius: "10px",
            overflow: "hidden",
          },
          body: {
            padding: "10px",
            overflowY: "auto",
          },
          content: {
            background: "rgba(26, 28, 34, 0.5)",
            backdropFilter: "saturate(180%) blur(15px)",
          },
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSearch}>
          <Form.Item
            name="keyword"
            rules={[{ required: true, message: "请输入搜索关键词" }]}
          >
            <Input.Search
              placeholder="请输入搜索关键词"
              enterButton={
                <Button icon={<SearchOutlined />} type="primary">
                  搜索
                </Button>
              }
              onSearch={handleSearch}
              loading={loading}
            />
          </Form.Item>
        </Form>
        <Divider>搜索结果</Divider>
        {loading ? (
          <Skeleton active />
        ) : searchResults.length > 0 ? (
          <List
            dataSource={searchResults}
            renderItem={(item) => (
              <ZhihuItem
                item={item}
                key={item.id}
                handleVote={handleVote}
                openQuestionDetailDrawer={openQuestionDetailDrawer}
              />
            )}
          />
        ) : (
          <Empty description="暂无搜索结果" />
        )}
      </Drawer>
    </>
  );
};

export default SearchDrawer;
