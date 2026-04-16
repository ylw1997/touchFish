/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-07-23 13:59:10
 * @LastEditTime: 2025-09-24 15:31:58
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\x\src\components\SearchDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Drawer, Button, Input, Form, Empty, Divider } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import InfiniteScroll from "react-infinite-scroll-component";
import { useEffect, useCallback, memo, useMemo } from "react";
import { xItem, xUser } from "../../../types/x";
import XCard from "./XCard";
import useXAction, { mergeUniqueXItems } from "../hooks/useXAction";
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
  onTranslate?: (item: xItem) => void;
  onClearTranslation?: (item: xItem) => void;
}

// Extracted and Memoized SearchList Component
const SearchList = memo(
  ({ xs, loading, getUserBlog, hasMore, loadMore, ...xCardProps }: any) => {
    if (loading && xs.length === 0) {
      return loaderFunc();
    }

    if (!Array.isArray(xs) || xs.length === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    // Render X list with InfiniteScroll
    return (
      <InfiniteScroll
        dataLength={xs.length}
        next={loadMore}
        hasMore={hasMore}
        loader={loaderFunc()}
        endMessage={<Divider plain>没有了🤐</Divider>}
        scrollableTarget="scrollableSearchDiv"
      >
        {xs.map((item: any) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <XCard item={item} onUserClick={getUserBlog} {...xCardProps} isH5 />
          </motion.div>
        ))}
      </InfiniteScroll>
    );
  },
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
  onTranslate: parentOnTranslate,
  onClearTranslation: parentOnClearTranslation,
}) => {
  const [form] = Form.useForm();

  const {
    list: searchResults,
    setList: setSearchResults,
    isFetching: loading,
    userXCursor: cursor,
    setUserXCursor: setCursor,
    hasMore,
    setHasMore,
    clearList: clear,
    copyLink,
    handleToggleComments,
    handleExpandLongX,
    handleCommentOrRepost,
    handleLike,
    cancelFollow,
    followUser,
    getXSearch,
    handleTranslate,
    handleClearTranslation,
  } = useXAction();

  const handleSearch = useCallback(
    async (isLoadMore = false) => {
      try {
        const values = await form.validateFields();
        if (!values.keyword) return;

        if (!isLoadMore) {
          clear();
        }

        const currentCursor = isLoadMore ? cursor : undefined;
        const result = await getXSearch({
          query: values.keyword,
          cursor: currentCursor,
        });

        const newStatuses = result.statuses || [];
        if (isLoadMore) {
          setSearchResults((prev) => mergeUniqueXItems(prev, newStatuses));
        } else {
          setSearchResults(newStatuses);
        }

        const nextCursor = result.max_id_str;
        setCursor(nextCursor || "");
        setHasMore(!!nextCursor);
      } catch (error) {
        console.error(error);
      }
    },
    [form, clear, getXSearch, cursor, setCursor, setHasMore, setSearchResults],
  );

  useEffect(() => {
    if (open && initialKeyword) {
      form.setFieldsValue({ keyword: initialKeyword });
      handleSearch();
    }
  }, [form, initialKeyword, open, handleSearch]);

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
      onTranslate: handleTranslate || parentOnTranslate,
      onClearTranslation: handleClearTranslation || parentOnClearTranslation,
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
      handleTranslate,
      handleClearTranslation,
      parentOnTranslate,
      parentOnClearTranslation,
    ],
  );

  return (
    <>
      <Drawer
        title="X 搜索"
        placement="bottom"
        height={searchResults.length > 0 ? "calc(100vh - 150px)" : "auto"}
        open={open}
        onClose={closeFunc}
        destroyOnHidden
        styles={{
          body: {
            padding: "0 5px",
          },
        }}
      >
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
              style={{
                marginTop: "10px",
              }}
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
        <div
          id="scrollableSearchDiv"
          style={{
            height: searchResults.length > 0 ? "calc(100vh - 260px)" : "auto",
            overflow: "auto",
            padding: "0 5px",
          }}
        >
          <SearchList
            xs={searchResults}
            loading={loading}
            getUserBlog={getUserBlog}
            hasMore={hasMore}
            loadMore={() => handleSearch(true)}
            {...xCardProps}
          />
        </div>
      </Drawer>
    </>
  );
};

export default SearchDrawer;
