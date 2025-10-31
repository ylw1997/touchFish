import { HeartOutlined, MessageOutlined } from "@ant-design/icons";
import { List, Avatar, Space, Tag } from "antd";

const CommonItem: React.FC<{ c: any, [key: string]: any }> = ({ c,...arg }) => {
  const formatTime = (ts?: number) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return "";
    }
  };
  return (
    <List.Item key={c.id} {...arg}>
      <div style={{ display: "flex", width: "100%", gap: 8 }}>
        <Avatar src={c.user_info?.image} size={32}>
          {c.user_info?.nickname?.[0]}
        </Avatar>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontWeight: 500 }}>{c.user_info?.nickname}</span>
            <span style={{ color: "#999", fontSize: 12 }}>
              {formatTime(c.create_time)}
            </span>
          </div>
          
          <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
            {c.content}
          </div>
          
          <Space size={4} style={{ marginTop: 4 }} wrap>
            {c.show_tags?.includes("is_author") && (
              <Tag color="green">作者</Tag>
            )}
            {c.like_count && (
              <Tag color="pink">
                <HeartOutlined /> {c.like_count}
              </Tag>
            )}
            {c.sub_comment_count && Number(c.sub_comment_count) > 0 && (
              <Tag color="blue">
                <MessageOutlined /> {c.sub_comment_count}
              </Tag>
            )}
            {c.ip_location && (
              <Tag color="purple">
              {c.ip_location}
            </Tag>
          )}
          </Space>
          {c.sub_comments && c.sub_comments.length > 0 && (
            <List
              dataSource={c.sub_comments}
              renderItem={(subComment) => <CommonItem c={subComment} style={{
                padding:'5px 0'
              }} />}
              style={{ marginTop: 12 }}
            />
          )}
        </div>
      </div>
    </List.Item>
  );
};

export default CommonItem;
