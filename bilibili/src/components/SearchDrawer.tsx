/*
 * @Description: B站搜索抽屉
 */
import { Drawer, Button, Input, Form, List, Empty, Divider } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import type { BilibiliSearchVideoItem } from "../types/bilibili";
import useBilibiliAction from "../hooks/useBilibiliAction";
import VideoCard from "./VideoCard";

interface SearchDrawerProps {
  open: boolean;
  onClose: () => void;
  onGetPlayUrl?: (bvid: string, cid: number) => Promise<any>;
  onGetDanmaku?: (cid: number) => Promise<any>;
}

const SearchDrawer: React.FC<SearchDrawerProps> = ({
  open,
  onClose,
  onGetPlayUrl,
  onGetDanmaku,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<BilibiliSearchVideoItem[]>(
    []
  );
  const { searchBilibili, addToWatchLater } = useBilibiliAction();

  const handleSearch = useCallback(
    async ({ keyword }: { keyword: string }) => {
      const trimmed = keyword?.trim();
      if (!trimmed) {
        return;
      }
      setSearchResults([]);
      setLoading(true);
      try {
        const result = await searchBilibili(trimmed);
        if (result.code === 0 && result.data?.result) {
          // 从 result 中提取 video 类型的数据
          const videoResult = result.data.result.find(
            (item) => item.result_type === "video"
          );
          if (videoResult?.data) {
            setSearchResults(videoResult.data);
          }
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    },
    [searchBilibili]
  );

  const closeFunc = useCallback(() => {
    onClose();
    form.resetFields();
    setSearchResults([]);
    setLoading(false);
  }, [form, onClose]);

  // 将搜索结果转换为 VideoCard 需要的格式
  const convertToListItem = (item: BilibiliSearchVideoItem) => {
    // 解析时长字符串 "27:56" -> 秒数
    const durationParts = item.duration.split(":").map(Number);
    let durationSeconds = 0;
    if (durationParts.length === 2) {
      durationSeconds = durationParts[0] * 60 + durationParts[1];
    } else if (durationParts.length === 3) {
      durationSeconds =
        durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2];
    }

    return {
      id: item.id,
      bvid: item.bvid,
      cid: 0, // 搜索结果没有 cid，需要后续获取
      uri: item.arcurl,
      pic: item.pic.startsWith("//") ? `https:${item.pic}` : item.pic,
      title: item.title.replace(/<[^>]+>/g, ""), // 移除 HTML 标签（高亮标签）
      duration: durationSeconds,
      pubdate: item.pubdate,
      owner: {
        mid: item.mid,
        name: item.author,
        face: item.upic.startsWith("//") ? `https:${item.upic}` : item.upic,
      },
      stat: {
        view: item.play,
        like: item.like,
        danmaku: item.danmaku,
      },
      is_followed: 0,
    };
  };

  return (
    <Drawer
      getContainer={false}
      title="B站搜索"
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
      </Form>
      <Divider>搜索结果</Divider>
      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>加载中...</div>
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
              style={{ marginBottom: 12 }}
            >
              <VideoCard
                item={convertToListItem(item)}
                onGetPlayUrl={onGetPlayUrl}
                onGetDanmaku={onGetDanmaku}
                onAddToWatchLater={addToWatchLater}
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
  );
};

export default SearchDrawer;
