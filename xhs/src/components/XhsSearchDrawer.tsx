import { Drawer, Button, Input, Form, List, Empty, Divider } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useState, useCallback, useRef } from "react";
import { createXhsApi } from "../api";
import { useRequest } from "../hooks/useRequest";
import { loaderFunc } from "../utils/loader";
import { generateXB3TraceId } from "../utils/utils";
import XhsFeedCard from "./XhsFeedCard";
import FeedDetailDrawer from "./FeedDetailDrawer";

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

  return (
    <Drawer
      title="小红书搜索"
      placement="bottom"
      height={results.length > 0 ? "90vh" : "auto"}
      open={open}
      onClose={closeFunc}
      destroyOnHidden
      styles={{
        wrapper: {
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          overflow: "hidden",
        },
        body: { padding: 12, paddingTop: 20, overflowY: "auto" },
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
      />
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
      <Divider>搜索结果</Divider>
      {loading && results.length === 0 ? (
        loaderFunc()
      ) : results.length > 0 ? (
        <List
          dataSource={results}
          className="xhs-waterfall"
          renderItem={(item: any) => (
            <div key={item.id} className="xhs-waterfall-item">
              <XhsFeedCard data={item} onClick={handleOpenDetail} />
            </div>
          )}
        />
      ) : (
        <Empty
          description="暂无搜索结果"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
      {hasMore && !loading && results.length > 0 && (
        <div style={{ textAlign: "center", padding: 12 }}>
          <Button
            variant="filled"
            color="default"
            loading={loading}
            onClick={loadMore}
          >
            {loading ? "加载中..." : "加载更多"}
          </Button>
        </div>
      )}
    </Drawer>
  );
};

export default XhsSearchDrawer;
