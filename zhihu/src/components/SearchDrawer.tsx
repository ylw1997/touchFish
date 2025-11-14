import { Drawer, Button, Input, Form, List, Empty, Divider, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import type { ZhihuItemData } from "../../../type";
import ZhihuItem from "./ZhihuItem";
import { loaderFunc } from "../utils/loader";
import { useHasExpanded, useExpandedStore } from "../store/expanded";
import useZhihuAction from "../hooks/useZhihuAction";

interface SearchDrawerProps {
  open: boolean;
  onClose: () => void;
  openQuestionDetailDrawer: (questionId: string, title: string) => void;
  handleVote: (
    answerId: string,
    type: "up" | "neutral",
  ) => void;
  showImg?: boolean;
}

const SearchDrawer: React.FC<SearchDrawerProps> = ({
  open,
  onClose,
  openQuestionDetailDrawer,
  handleVote,
  showImg = true,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ZhihuItemData[]>([]);
  const { searchZhihu } = useZhihuAction();
  const hasExpanded = useHasExpanded();
  const collapseAll = useExpandedStore(state => state.collapseAll);

  const handleSearch = useCallback(
    async ({ keyword }: { keyword: string }) => {
      const trimmed = keyword?.trim();
      if (!trimmed) {
        return;
      }
      setSearchResults([]);
      setLoading(true);
      try {
        const results = await searchZhihu(trimmed);
        setSearchResults(results || []);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    },
    [searchZhihu]
  );

  const closeFunc = useCallback(() => {
    onClose();
    form.resetFields();
    setSearchResults([]);
    setLoading(false);
  }, [form, onClose]);

  return (
    <>
      <Drawer
        getContainer={false}
        title="知乎搜索"
        placement="bottom"
        height={searchResults.length > 0 ? "90vh" : "auto"}
        open={open}
        onClose={closeFunc}
        destroyOnHidden
        styles={{
          wrapper: {
            borderTopLeftRadius: "10px",
            borderTopRightRadius: "10px",
            overflow: "hidden",
          },
          body: {
            padding: "5px",
            paddingTop: "20px",
            overflowY: "auto",
          },
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSearch}>
          <Form.Item
            name="keyword"
            rules={[{ required: true, message: "请输入搜索关键词" }]}
          >
            <Input.Search
              variant="filled"
              placeholder="请输入搜索关键词"
              enterButton={
                <Button icon={<SearchOutlined />} type="primary">
                  搜索
                </Button>
              }
              onSearch={() => form.submit()}
              loading={loading}
            />
          </Form.Item>
          {hasExpanded && (
            <Space style={{ marginBottom: 8 }}>
              <Button
                onClick={() => collapseAll()}
                variant="filled"
                color="default"
              >
                折叠全部
              </Button>
            </Space>
          )}
        </Form>
        <Divider>搜索结果</Divider>
        {loading ? (
          loaderFunc()
        ) : searchResults.length > 0 ? (
          <List
            dataSource={searchResults}
            renderItem={(item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <ZhihuItem
                  item={item}
                  handleVote={handleVote}
                  openQuestionDetailDrawer={openQuestionDetailDrawer}
                  showImg={showImg}
                />
              </motion.div>
            )}
          />
        ) : (
          <Empty
            description="暂无搜索结果"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Drawer>
    </>
  );
};

export default SearchDrawer;
