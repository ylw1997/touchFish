/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-07-23 13:59:10
 * @LastEditTime: 2025-07-31 16:34:19
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\components\SearchDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Drawer, Button, Input, Form, List, Divider, Tag, Tabs } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useMessageHandler } from "../hooks/useMessageHandler";
import { weiboUser } from "../../../type";
import { WeiboUserItem } from "./WeiboUserItem";
import { parseArray } from "../utils";
import WeiboCard from "./WeiboCard";
import useWeiboAction from "../hooks/useWeiboAction";

interface SearchDrawerProps {
  open: boolean;
  onClose: () => void;
  source: string;
  preSource: string; // 上一个source
  showImg?: boolean;
  activeVideoUrl?: string | null;
  onPlayVideo?: (url?: string) => void;
  getUserBlog: (user: weiboUser) => void;
}

export interface SearchType {
  type: "3" | "60";
  card_type: 10 | 9;
  text: string;
  field: string;
}

const SearchInfo = [
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
] as SearchType[];

const SearchDrawer: React.FC<SearchDrawerProps> = ({
  open,
  onClose,
  source,
  preSource,
  showImg,
  activeVideoUrl,
  onPlayVideo,
  getUserBlog,
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
        console.log(
          payload,
          payload.data.cards,
          parseArray(payload.data.cards, searchType)
        );
        if (searchType.type === "3") {
          setUsers(parseArray(payload.data.cards, searchType));
        } else if (searchType.type === "60") {
          setWeibos(parseArray(payload.data.cards, searchType));
          console.log(weibos);
        }
      } else {
        messageApi.error(payload.msg || "搜索失败");
      }
    },
    SENDHOTSEARCH: (payload: any) => {
      messageApi.destroy("GETHOTSEARCH");
      if (payload.ok === 1) {
        setHotSearch((payload.data.realtime || []).slice(0, 10));
      } else {
        messageApi.error(payload.msg || "获取热搜失败");
      }
    },
  };

  useMessageHandler(handlers);

  useEffect(() => {
    if (open) {
      sendMessage("GETHOTSEARCH", null, "正在获取热搜...", "weibo");
    }
  }, [open, sendMessage]);

  const handleSearch = (searchType: SearchType) => {
    form
      .validateFields()
      .then((values) => {
        setLoading(true);
        const payload = `100103type=${searchType.type}&q=${values.keyword}&t=`;
        sendMessage("GETSEARCH", payload, "正在搜索...", source);
      })
      .catch(() => {});
  };

  const closeFunc = () => {
    form.resetFields();
    clear();
    onClose();
  };
  const clear = () => {
    setUsers([]);
    setWeibos([]);
    setLoading(false);
  };

  const SearchList = ({ searchType }: { searchType: SearchType }) => {
    return (
      <>
        {searchType.type === "3" ? (
          <List
            itemLayout="horizontal"
            dataSource={users}
            loading={loading}
            renderItem={(item) => WeiboUserItem(item, getUserBlog)}
          />
        ) : (
          weibos.map((item) => (
            <WeiboCard
              key={item.id}
              item={item}
              onFollow={(userinfo) => followUser(userinfo, preSource)}
              onUserClick={getUserBlog}
              cancelFollow={(userinfo) => cancelFollow(userinfo, preSource)}
              onExpandLongWeibo={handleExpandLongWeibo}
              onToggleComments={handleToggleComments}
              showActions={false}
              onCopyLink={copyLink}
              onCommentOrRepost={handleCommentOrRepost}
              onLikeOrCancelLike={handleLike}
              showImg={showImg}
              getUserByName={getUserByName}
              activeVideoUrl={activeVideoUrl}
              onPlayVideo={onPlayVideo}
              isH5
            />
          ))
        )}
      </>
    );
  };

  const handlerTabChange = (key: string) => {
    const selectedType = SearchInfo.find((item) => item.type === key)!;
    setSearchType(selectedType);
    handleSearch(selectedType);
    clear();
  };

  return (
    <>
      {contextHolder}
      <Drawer
        title="搜索微博"
        placement="bottom"
        height={"80vh"}
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
            paddingTop: "0",
            overflowY: "auto",
          },
          content: {
            background: "rgba(26, 28, 34, 0.5)",
            backdropFilter: "saturate(180%) blur(15px)",
          },
        }}
      >
        <Divider>微博热搜</Divider>
        <div className="hot-search-grid">
          {hotSearch.map((item: any, index: number) => (
            <Tag
              key={item.word}
              className="hot-search-tag"
              color={index < 3 ? "red" : index < 6 ? "volcano" : "orange"}
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
              style={{ background: "#14141482" }}
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
        {
          <Tabs
            defaultActiveKey={searchType.type}
            centered
            onChange={handlerTabChange}
            items={SearchInfo.map((item) => {
              return {
                label: item.text,
                key: item.type,
                children: <SearchList searchType={searchType} />,
              };
            })}
          />
        }
      </Drawer>
    </>
  );
};

export default SearchDrawer;
