/*
 * @Description: B站搜索抽屉
 */
import {
  Drawer,
  Button,
  Input,
  Form,
  List,
  Empty,
  Divider,
  Card,
  Tag,
  Space,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import type {
  BilibiliSearchVideoItem,
  BilibiliOwner,
  BilibiliSearchUserItem,
} from "../types/bilibili";
import useBilibiliAction from "../hooks/useBilibiliAction";
import VideoCard from "./VideoCard";

interface SearchDrawerProps {
  open: boolean;
  onClose: () => void;
  onGetPlayUrl?: (bvid: string, cid: number) => Promise<any>;
  onGetDanmaku?: (cid: number) => Promise<any>;
  onUserClick?: (owner: BilibiliOwner) => void;
}

// 格式化数字
const formatCount = (count: number): string => {
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + "万";
  }
  return count.toString();
};

const SearchDrawer: React.FC<SearchDrawerProps> = ({
  open,
  onClose,
  onGetPlayUrl,
  onGetDanmaku,
  onUserClick,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<BilibiliSearchVideoItem[]>(
    []
  );
  const [userResult, setUserResult] = useState<BilibiliSearchUserItem | null>(
    null
  );
  const { searchBilibili, addToWatchLater } = useBilibiliAction();

  const handleSearch = useCallback(
    async ({ keyword }: { keyword: string }) => {
      const trimmed = keyword?.trim();
      if (!trimmed) {
        return;
      }
      setSearchResults([]);
      setUserResult(null);
      setLoading(true);
      try {
        const result = await searchBilibili(trimmed);
        if (result.code === 0 && result.data?.result) {
          // 提取用户结果
          const userRes = result.data.result.find(
            (item) => item.result_type === "bili_user"
          );
          if (
            userRes?.data &&
            Array.isArray(userRes.data) &&
            userRes.data.length > 0
          ) {
            setUserResult(userRes.data[0] as BilibiliSearchUserItem);
          }

          // 提取视频结果
          const videoRes = result.data.result.find(
            (item) => item.result_type === "video"
          );
          if (videoRes?.data && Array.isArray(videoRes.data)) {
            setSearchResults(videoRes.data as BilibiliSearchVideoItem[]);
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
    setUserResult(null);
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

  const handleUserCardClick = () => {
    if (userResult && onUserClick) {
      onUserClick({
        mid: userResult.mid,
        name: userResult.uname,
        face: userResult.upic.startsWith("//")
          ? `https:${userResult.upic}`
          : userResult.upic,
      });
    }
  };

  return (
    <Drawer
      getContainer={false}
      title="B站搜索"
      placement="bottom"
      height={searchResults.length > 0 || userResult ? "90vh" : "auto"}
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
      ) : searchResults.length > 0 || userResult ? (
        <>
          {/* 用户搜索结果卡片 */}
          {userResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ marginBottom: 12 }}
            >
              <Card size="small" styles={{ body: { padding: 12 } }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <img
                    src={
                      userResult.upic.startsWith("//")
                        ? `https:${userResult.upic}`
                        : userResult.upic
                    }
                    alt={userResult.uname}
                    referrerPolicy="no-referrer"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Space>
                        <span
                          onClick={handleUserCardClick}
                          style={{
                            fontSize: 16,
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          {userResult.uname}
                        </span>
                        <Tag style={{ margin: 0, fontSize: 11 }}>
                          LV{userResult.level}
                        </Tag>
                      </Space>
                      {/* 暂时放置关注按钮占位，或者可以显示跳转/查看详情 */}
                      <Button
                        color="default"
                        variant="filled"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserCardClick();
                        }}
                      >
                        查看
                      </Button>
                    </div>
                    {userResult.official_verify?.desc && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#00a1d6",
                          marginTop: 2,
                        }}
                      >
                        {userResult.official_verify.desc}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    color: "var(--vscode-descriptionForeground)",
                    lineHeight: 1.5,
                    marginBottom: 10,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {userResult.usign}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    borderTop: "1px solid var(--vscode-widget-border)",
                    paddingTop: 12,
                    marginTop: 4,
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {formatCount(userResult.fans)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--vscode-descriptionForeground)",
                      }}
                    >
                      粉丝
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {userResult.videos}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--vscode-descriptionForeground)",
                      }}
                    >
                      视频
                    </div>
                  </div>
                  {/* 搜索接口如果没有获赞数，可以隐藏或者显示为 - */}
                  {/* 注意：搜索结果user字段可能不包含like数 */}
                </div>
              </Card>
            </motion.div>
          )}

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
        </>
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
