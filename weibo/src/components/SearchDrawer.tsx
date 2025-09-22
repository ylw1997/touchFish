/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-07-23 13:59:10
 * @LastEditTime: 2025-09-22 09:38:27
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\components\SearchDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import {
  Drawer,
  Button,
  Input,
  Form,
  List,
  Divider,
  Tag,
  Tabs,
  Empty,
} from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { useEffect, useState, useCallback, memo, useMemo } from "react";
import { weiboUser, SearchType } from "../../../type";
import { WeiboUserItem } from "./WeiboUserItem";
import WeiboCard from "./WeiboCard";
import useWeiboAction from "../hooks/useWeiboAction";
import { loaderFunc } from "../utils/loader";
import { SearchInfo } from "../data/search";

// Component Props
interface SearchDrawerProps {
  open: boolean;
  onClose: () => void;
  showImg?: boolean;
  activeVideoUrl?: string | null;
  onPlayVideo?: (url?: string) => void;
  getUserBlog: (user: weiboUser) => void;
  initialKeyword?: string;
  onTopicClick: (topic: string) => void;
}

// Extracted and Memoized SearchList Component
const SearchList = memo(
  ({
    searchType,
    users,
    weibos,
    loading,
    getUserBlog,
    ...weiboCardProps
  }: any) => {
    if (loading) {
      return loaderFunc();
    }
    if (searchType.type === "3") {
      return (
        <List
          itemLayout="horizontal"
          dataSource={users}
          loading={loading}
          renderItem={(item: weiboUser) => WeiboUserItem(item, getUserBlog)}
        />
      );
    }

    if (weibos.length === 0) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    // Render Weibo list
    return weibos.map((item: any) => (
      <WeiboCard
        key={item.id}
        item={item}
        onUserClick={getUserBlog}
        {...weiboCardProps}
        isH5
      />
    ));
  }
);

// Main Drawer Component
const SearchDrawer: React.FC<SearchDrawerProps> = ({
  open,
  onClose,
  showImg,
  activeVideoUrl,
  onPlayVideo,
  getUserBlog,
  initialKeyword,
  onTopicClick,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<weiboUser[]>([]);
  const [hotSearch, setHotSearch] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<SearchType>(SearchInfo[0]);

  const {
    list: weibos,
    copyLink,
    contextHolder,
    handleToggleComments,
    handleExpandLongWeibo,
    handleCommentOrRepost,
    handleLike,
    cancelFollow,
    followUser,
    setList: setWeibos,
    getUserByName,
    getHotSearch,
    getWeiboSearch,
  } = useWeiboAction();

  const handleRefreshHotSearch = useCallback(async () => {
    const result = await getHotSearch();
    setHotSearch(result);
  }, [getHotSearch]);

  const clear = useCallback(() => {
    setUsers([]);
    setWeibos([]);
    setLoading(false);
  }, [setWeibos]);

  const handleSearch = useCallback(
    async (currentSearchType: SearchType) => {
      try {
        const values = await form.validateFields();
        if (!values.keyword) return;
        clear();
        setLoading(true);
        const result = await getWeiboSearch(values.keyword, currentSearchType);
        if (currentSearchType.type === "3") {
          setUsers(result);
        } else if (currentSearchType.type === "60") {
          setWeibos(result as any);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [form, clear, getWeiboSearch, setWeibos]
  );

  useEffect(() => {
    if (open) {
      handleRefreshHotSearch();
      if (initialKeyword) {
        form.setFieldsValue({ keyword: initialKeyword });
        handleSearch(SearchInfo[0]);
      }
    }
  }, [form, handleRefreshHotSearch, handleSearch, initialKeyword, open]);

  const closeFunc = useCallback(() => {
    form.resetFields();
    clear();
    setSearchType(SearchInfo[0]);
    onClose();
  }, [form, clear, onClose]);

  const handlerTabChange = useCallback(
    (key: string) => {
      const selectedType = SearchInfo.find((item) => item.type === key)!;
      setSearchType(selectedType);
      handleSearch(selectedType);
    },
    [handleSearch]
  );

  const weiboCardProps = useMemo(
    () => ({
      onFollow: followUser,
      cancelFollow: cancelFollow,
      onExpandLongWeibo: handleExpandLongWeibo,
      onToggleComments: handleToggleComments,
      showActions: false,
      onCopyLink: copyLink,
      onCommentOrRepost: handleCommentOrRepost,
      onLikeOrCancelLike: handleLike,
      showImg,
      getUserByName,
      activeVideoUrl,
      onPlayVideo,
      onTopicClick,
    }),
    [
      followUser,
      cancelFollow,
      handleExpandLongWeibo,
      handleToggleComments,
      copyLink,
      handleCommentOrRepost,
      handleLike,
      showImg,
      getUserByName,
      activeVideoUrl,
      onPlayVideo,
      onTopicClick,
    ]
  );

  return (
    <>
      {contextHolder}
      <Drawer
        title="微博搜索"
        placement="bottom"
        height={
          weibos.length > 0 || users.length > 0
            ? "calc(100vh - 150px)"
            : "850px"
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
        <Divider>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span>微博热搜</span>
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={handleRefreshHotSearch}
              style={{ margin: "0 8px" }}
            />
          </div>
        </Divider>
        <div className="hot-search-grid">
          {hotSearch.map((item: any, index: number) => (
            <Tag
              key={item.word}
              className="hot-search-tag "
              color={index < 3 ? "red" : index < 10 ? "volcano" : "orange"}
              onClick={() => {
                form.setFieldsValue({ keyword: `#${item.word}#` });
                handleSearch(searchType);
              }}
              title={item.word}
              bordered={false}
            >
              {`${index + 1}. ${item.word}`}
            </Tag>
          ))}
        </div>
        <Divider>搜索微博</Divider>
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
              onPressEnter={() => handleSearch(searchType)}
              onSearch={() => handleSearch(searchType)}
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
        <Tabs
          defaultActiveKey={searchType.type}
          centered
          onChange={handlerTabChange}
          items={SearchInfo.map((item) => ({
            label: item.text,
            key: item.type,
            children: (
              <SearchList
                searchType={searchType}
                users={users}
                weibos={weibos}
                loading={loading}
                getUserBlog={getUserBlog}
                {...weiboCardProps}
              />
            ),
          }))}
        />
      </Drawer>
    </>
  );
};

export default SearchDrawer;
