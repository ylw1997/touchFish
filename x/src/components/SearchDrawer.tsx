/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-07-23 13:59:10
 * @LastEditTime: 2025-09-24 15:31:58
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\x\src\components\SearchDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import {
  Drawer,
  Button,
  Input,
  Form,
  Divider,
  Empty,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback, memo, useMemo } from "react";
import { xItem, xUser } from "../../../types/x";
import XCard from "./XCard";
import useXAction from "../hooks/useXAction";
import { loaderFunc } from "../utils/loader";

// Component Props
interface SearchDrawerProps {
  open: boolean;
  onClose: () => void;
  showImg?: boolean;
  getUserBlog: (user: xUser) => void;
  initialKeyword?: string;
  onTopicClick: (topic: string) => void;
  getUserByName: (username: string) => void;
}

// Extracted and Memoized SearchList Component
const SearchList = memo(
  ({
    xs,
    loading,
    getUserBlog,
    ...xCardProps
  }: any) => {
    if (loading) {
      return loaderFunc();
    }

    if (xs.length === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    // Render X list
    return xs.map((item: any) => (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <XCard
          item={item}
          onUserClick={getUserBlog}
          {...xCardProps}
          isH5
        />
      </motion.div>
    ));
  }
);

// Main Drawer Component
const SearchDrawer: React.FC<SearchDrawerProps> = ({
  open,
  onClose,
  showImg,
  getUserBlog,
  initialKeyword,
  onTopicClick,
  getUserByName,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<xItem[]>([]);

  const {
    copyLink,
    handleToggleComments,
    handleExpandLongX,
    handleCommentOrRepost,
    handleLike,
    cancelFollow,
    followUser,
    getXSearch,
  } = useXAction();

  const clear = useCallback(() => {
    setSearchResults([]);
    setLoading(false);
  }, []);

  const handleSearch = useCallback(
    async () => {
      try {
        const values = await form.validateFields();
        if (!values.keyword) return;
        clear();
        setLoading(true);
        const result = await getXSearch(values.keyword, {
          type: "60",
          card_type: 9,
          text: "热门",
          field: "mblog",
        });
        setSearchResults(result.statuses || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [form, clear, getXSearch]
  );

  useEffect(() => {
    if (open && initialKeyword) {
      form.setFieldsValue({ keyword: initialKeyword });
      handleSearch();
    }
  }, [form, handleSearch, initialKeyword, open]);

  const closeFunc = useCallback(() => {
    form.resetFields();
    clear();
    onClose();
  }, [form, clear, onClose]);

  const xCardProps = useMemo(
    () => ({
      onFollow: followUser,
      cancelFollow: cancelFollow,
      onExpandLongX: handleExpandLongX,
      onToggleComments: handleToggleComments,
      showActions: false,
      onCopyLink: copyLink,
      onCommentOrRepost: handleCommentOrRepost,
      onLikeOrCancelLike: handleLike,
      showImg,
      getUserByName,
      onTopicClick,
    }),
    [
      followUser,
      cancelFollow,
      handleExpandLongX,
      handleToggleComments,
      copyLink,
      handleCommentOrRepost,
      handleLike,
      showImg,
      getUserByName,
      onTopicClick,
    ]
  );

  return (
    <>
      <Drawer
        title="X 搜索"
        placement="bottom"
        height={
          searchResults.length > 0
            ? "calc(100vh - 150px)"
            : "auto"
        }
        open={open}
        onClose={closeFunc}
        destroyOnHidden
        styles={{
          body: {
            padding: "0 5px",
          },
        }}
      >
        <Divider>搜索 X</Divider>
        <Form form={form} layout="vertical">
          <Form.Item
            label={false}
            name="keyword"
            rules={[{ required: true, message: "请输入搜索关键词" }]}
          >
            <Input.Search
              placeholder="请输入搜索关键词"
              disabled={loading}
              variant="filled"
              onPressEnter={() => handleSearch()}
              onSearch={() => handleSearch()}
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
        <SearchList
          xs={searchResults}
          loading={loading}
          getUserBlog={getUserBlog}
          {...xCardProps}
        />
      </Drawer>
    </>
  );
};

export default SearchDrawer;
