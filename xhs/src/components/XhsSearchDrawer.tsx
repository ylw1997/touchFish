import { Button, Input, Form, Empty, Divider } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useState, useCallback } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Masonry from "react-masonry-css";
import { useRequest } from "../hooks/useRequest";
import { useXhsSearch } from "../hooks/useXhsSearch";
import { loaderFunc } from "../utils/loader";
import XhsFeedCard from "./XhsFeedCard";
import UserPostedDrawer from "./UserPostedDrawer";
import FeedDetailDrawer from "./FeedDetailDrawer";
import BaseDrawer from "./BaseDrawer";
import { INFINITE_SCROLL_CONFIG } from "../constants";

interface XhsSearchDrawerProps {
  open: boolean;
  onClose: () => void;
  showImg?: boolean; // 预留，后续如果图片展示策略不同可使用
}

const XhsSearchDrawer: React.FC<XhsSearchDrawerProps> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const { request, messageApi, contextHolder } = useRequest();

  // 使用搜索 Hook
  const { loading, results, hasMore, search, loadMore, reset } = useXhsSearch({
    request,
  });

  // 详情状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string>("");
  const [activeXsecToken, setActiveXsecToken] = useState<string>("");

  // 用户主页
  const [userOpen, setUserOpen] = useState(false);
  const [userParams, setUserParams] = useState<{
    cursor: string;
    user_id: string;
    xsec_token: string;
    user?: any;
  }>({
    cursor: "",
    user_id: "",
    xsec_token: "",
  });

  const handleSearch = useCallback(
    async ({ keyword }: { keyword: string }) => {
      try {
        await search(keyword);
      } catch (e: any) {
        messageApi.error(e?.message || "搜索失败");
      }
    },
    [search, messageApi]
  );

  const closeFunc = useCallback(() => {
    onClose();
    form.resetFields();
    reset();
  }, [onClose, form, reset]);

  const handleOpenDetail = useCallback((raw: any) => {
    if (!raw?.id) return;
    setDetailOpen(true);
    setActiveNoteId(raw.id);
    setActiveXsecToken(raw.xsec_token);
  }, []);

  const handleOpenUser = useCallback(
    (raw: { id: string; xsec_token: string }, user: any) => {
      if (!user?.user_id) return;
      setUserParams({
        cursor: raw.id || "",
        user_id: user.user_id,
        xsec_token: raw.xsec_token,
        user,
      });
      setUserOpen(true);
    },
    []
  );

  return (
    <>
      {contextHolder}
      <BaseDrawer
        open={open}
        onClose={closeFunc}
        title="小红书搜索"
        scrollableId="xhsSearchScrollableDiv"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearch}
          style={{ marginBottom: 12 }}
        >
          <Form.Item
            name="keyword"
            rules={[{ required: true, message: "请输入搜索关键词" }]}
            style={{ marginBottom: 0 }}
          >
            <Input.Search
              placeholder="请输入搜索关键词"
              enterButton={
                <Button icon={<SearchOutlined />} type="primary">
                  搜索
                </Button>
              }
              onSearch={() => form.submit()}
              loading={loading}
              allowClear
            />
          </Form.Item>
        </Form>

        <Divider style={{ margin: "12px 0" }}>搜索结果</Divider>

        {loading && results.length === 0 ? (
          loaderFunc()
        ) : results.length > 0 ? (
          <InfiniteScroll
            dataLength={results.length}
            next={loadMore}
            hasMore={hasMore}
            loader={loading ? loaderFunc() : null}
            endMessage={
              <div style={{ padding: 8, textAlign: "center", color: "#999" }}>
                没有更多了
              </div>
            }
            scrollableTarget="xhsSearchScrollableDiv"
            scrollThreshold={INFINITE_SCROLL_CONFIG.THRESHOLD}
          >
            <Masonry
              breakpointCols={{
                default: 2,
                1500: 5,
                1200: 4,
                900: 3,
                600: 2,
                300: 1,
              }}
              className="xhs-masonry"
              columnClassName="xhs-masonry-column"
            >
              {results.map((raw: any, index: number) => (
                <div
                  key={index}
                  className="xhs-waterfall-item"
                  style={{ animationDelay: `${(index % 10) * 50}ms` }}
                >
                  <XhsFeedCard
                    data={raw}
                    onClick={handleOpenDetail}
                    onUserClick={handleOpenUser}
                  />
                </div>
              ))}
            </Masonry>
          </InfiniteScroll>
        ) : (
          <Empty
            description="暂无搜索结果"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
        {/* 笔记详情弹窗 */}
        <FeedDetailDrawer
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setActiveNoteId("");
            setActiveXsecToken("");
          }}
          detail={{ note_id: activeNoteId, xsec_token: activeXsecToken }}
          onUserClick={(p) => {
            setUserParams(p);
            setUserOpen(true);
          }}
        />

        {/* 用户主页弹窗 */}
        <UserPostedDrawer
          open={userOpen}
          onClose={() => setUserOpen(false)}
          initParams={userParams}
        />
      </BaseDrawer>
    </>
  );
};

export default XhsSearchDrawer;
