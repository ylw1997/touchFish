import { Drawer, Button, Input, Form, Empty, Divider } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useState, useCallback, useRef } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { createXhsApi } from "../api";
import { useRequest } from "../hooks/useRequest";
import { loaderFunc } from "../utils/loader";
import { generateXB3TraceId } from "../utils/utils";
import XhsFeedCard from "./XhsFeedCard";
import UserPostedDrawer from "./UserPostedDrawer";
import FeedDetailDrawer from "./FeedDetailDrawer";
import Masonry from "react-masonry-css";
import { INFINITE_SCROLL_CONFIG } from "../constants";

interface XhsSearchDrawerProps {
  open: boolean;
  onClose: () => void;
  showImg?: boolean; // 预留，后续如果图片展示策略不同可使用
}

const XhsSearchDrawer: React.FC<XhsSearchDrawerProps> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const { request } = useRequest();
  const apiRef = useRef(createXhsApi(request));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchId, setSearchId] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // 详情状态
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string>("");
  const [activeXsecToken, setActiveXsecToken] = useState<string>("");
  // 用户主页
  const [userOpen, setUserOpen] = useState(false);
  const [userParams, setUserParams] = useState<{ cursor: string; user_id: string; xsec_token: string; user?: any }>({ cursor: '', user_id: '', xsec_token: '' });

  const handleSearch = useCallback(async ({ keyword }: { keyword: string }) => {
    const trimmed = keyword?.trim();
    if (!trimmed) return;
    setLoading(true);
    setPage(1);
    setResults([]);
    setHasMore(true);
    const newSearchId = generateXB3TraceId();
    setSearchId(newSearchId);
    try {
      const res: any = await apiRef.current.searchNotes({
        keyword: trimmed,
        page: 1,
        search_id: newSearchId,
      });
      const incoming = res?.items || [];
      setResults(incoming);
      setHasMore(res.has_more);
      setPage(2);
    } catch (e) {
      console.error("[xhs search] error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const keyword = form.getFieldValue("keyword") || "";
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res: any = await apiRef.current.searchNotes({
        keyword: trimmed,
        page,
        search_id: searchId,
      });
      const incoming = res?.items || [];
      setResults((prev) => [...prev, ...incoming]);
      setHasMore(res.has_more);
      setPage(page + 1);
    } catch (e) {
      console.error("[xhs search more] error", e);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page, searchId, form]);

  const closeFunc = useCallback(() => {
    onClose();
    form.resetFields();
    setResults([]);
    setPage(1);
    setSearchId("");
    setHasMore(true);
    setLoading(false);
  }, [onClose, form]);

  const handleOpenDetail = useCallback((raw: any) => {
    if (!raw?.id) return;
    setDetailOpen(true);
    setActiveNoteId(raw.id);
    setActiveXsecToken(raw.xsec_token);
  }, []);

  const handleOpenUser = useCallback((raw: {id: string, xsec_token: string}, user: any) => {
    if (!user?.user_id) return;
    setUserParams({ cursor: raw.id || '', user_id: user.user_id, xsec_token: raw.xsec_token, user });
    setUserOpen(true);
  }, []);

  return (
    <Drawer
      title="小红书搜索"
      placement="bottom"
      height="90vh"
      open={open}
      onClose={closeFunc}
      destroyOnHidden
      styles={{
        wrapper: {
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          overflow: "hidden",
        },
        body: { padding: 0, height: "100%", minHeight: 0 },
      }}
    >
      <FeedDetailDrawer
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setActiveNoteId("");
          setActiveXsecToken("");
        }}
        // 仅传递基础标识，Drawer 内部自行请求
        detail={{ note_id: activeNoteId, xsec_token: activeXsecToken }}
        onUserClick={(p) => {
          setUserParams(p);
          setUserOpen(true);
        }}
      />
      <UserPostedDrawer
        open={userOpen}
        onClose={() => setUserOpen(false)}
        initParams={userParams}
        onOpenDetail={(raw) => {
          handleOpenDetail(raw);
        }}
      />
      <div 
        id="xhsSearchScrollableDiv"
        style={{ 
          padding: 8, 
          height: "100%", 
          overflow: "auto" 
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
              style={{
                padding:'0'
              }}
            >
              {results.map((raw: any, index: number) => (
                <div
                  key={index}
                  className="xhs-waterfall-item"
                  style={{ animationDelay: `${(index % 10) * 50}ms` }}
                >
                  <XhsFeedCard data={raw} onClick={handleOpenDetail} onUserClick={handleOpenUser} />
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
      </div>
    </Drawer>
  );
};

export default XhsSearchDrawer;
