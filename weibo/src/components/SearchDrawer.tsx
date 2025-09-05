/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-07-23 13:59:10
 * @LastEditTime: 2025-09-05 08:46:41
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
  Skeleton,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useEffect, useState, useCallback, memo, useMemo } from "react";
import { useMessageHandler } from "../hooks/useMessageHandler";
import { weiboUser } from "../../../type";
import { WeiboUserItem } from "./WeiboUserItem";
import { parseArray } from "../utils";
import WeiboCard from "./WeiboCard";
import useWeiboAction from "../hooks/useWeiboAction";

// Component Props
interface SearchDrawerProps {
  open: boolean;
  onClose: () => void;
  source: string;
  preSource: string; // 上一个source
  showImg?: boolean;
  activeVideoUrl?: string | null;
  onPlayVideo?: (url?: string) => void;
  getUserBlog: (user: weiboUser) => void;
  initialKeyword?: string;
}

// Search Type Definition
export interface SearchType {
  type: "3" | "60";
  card_type: 10 | 9;
  text: string;
  field: string;
}

// Search Configuration
const SearchInfo: ReadonlyArray<SearchType> = [
  {
    type: "60",
    card_type: 9,
    text: "热门",
    field: "mblog",
  },
  {
    type: "3",
    card_type: 10,
    text: "用户",
    field: "user",
  },
];

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
      return (
        <Skeleton
          active
          style={{
            marginTop: "8px",
          }}
        />
      );
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
  source,
  preSource,
  showImg,
  activeVideoUrl,
  onPlayVideo,
  getUserBlog,
  initialKeyword,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<weiboUser[]>([]);
  const [hotSearch, setHotSearch] = useState([]);
  const [searchType, setSearchType] = useState<SearchType>(SearchInfo[0]);

  const {
    list: weibos,
    sendMessage,
    copyLink,
    contextHolder,
    handleToggleComments,
    handleExpandLongWeibo,
    handleCommentOrRepost,
    handleLike,
    cancelFollow,
    followUser,
    messageApi,
    setList: setWeibos,
    getUserByName,
  } = useWeiboAction(source);

  const handlers = {
    SENDSEARCH: (payload: any) => {
      messageApi.destroy("GETSEARCH");
      setLoading(false);
      if (payload.ok === 1) {
        const parsedData = parseArray(payload.data.cards, searchType);
        if (searchType.type === "3") {
          setUsers(parsedData);
        } else if (searchType.type === "60") {
          setWeibos(parsedData);
        }
      } else {
        messageApi.error(payload.msg || "搜索失败");
      }
    },
    SENDHOTSEARCH: (payload: any) => {
      messageApi.destroy("GETHOTSEARCH");
      if (payload.ok === 1) {
        setHotSearch((payload.data.realtime || []).slice(0, 20));
      }
    },
  };

  useMessageHandler(handlers);

  const clear = useCallback(() => {
    setUsers([]);
    setWeibos([]);
    setLoading(false);
    setSearchType(SearchInfo[0]);
  }, [setWeibos]);

  const handleSearch = useCallback(
    (currentSearchType: SearchType) => {
      form
        .validateFields()
        .then((values) => {
          if (!values.keyword) return;
          clear();
          setLoading(true);
          const payload = `100103type=${currentSearchType.type}&q=${values.keyword}&t=`;
          sendMessage("GETSEARCH", payload, "正在搜索...", source);
        })
        .catch(() => {});
    },
    [form, sendMessage, source, clear]
  );

  useEffect(() => {
    if (open) {
      sendMessage("GETHOTSEARCH", null, "正在获取热搜...", "weibo");
      if (initialKeyword) {
        form.setFieldsValue({ keyword: initialKeyword });
        handleSearch(SearchInfo[0]);
      }
    }
  }, [open, initialKeyword, form, handleSearch, sendMessage]);

  const closeFunc = useCallback(() => {
    form.resetFields();
    clear();
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

  const weiboCardProps = useMemo(() => ({
    onFollow: (userinfo: weiboUser) => followUser(userinfo, preSource),
    cancelFollow: (userinfo: weiboUser) => cancelFollow(userinfo, preSource),
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
  }), [
    followUser,
    preSource,
    cancelFollow,
    handleExpandLongWeibo,
    handleToggleComments,
    copyLink,
    handleCommentOrRepost,
    handleLike,
    showImg,
    getUserByName,
    activeVideoUrl,
    onPlayVideo
  ]);

  return (
    <>
      {contextHolder}
      <Drawer
        title="微博搜索"
        placement="bottom"
        height={"90vh"}
        open={open}
        onClose={closeFunc}
        destroyOnHidden
        zIndex={9999}
        
      >
        <Divider>微博热搜</Divider>
        <div className="hot-search-grid">
          {hotSearch.map((item: any, index: number) => (
            <Tag
              key={item.word}
              className="hot-search-tag"
              color={index < 3 ? "red" : index < 10 ? "volcano" : "orange"}
              onClick={() => {
                form.setFieldsValue({ keyword: `#${item.word}#` });
                handleSearch(searchType);
              }}
              title={item.word}
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
