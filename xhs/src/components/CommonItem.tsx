/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-31 14:01:36
 * @LastEditTime: 2025-11-03 09:08:15
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\CommonItem.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
import { HeartOutlined, MessageOutlined } from "@ant-design/icons";
import { List, Avatar, Space, Tag, Image } from "antd";

interface CommonItemProps { c: any; onUserClick?: (userInfo: any) => void; [key: string]: any }
const CommonItem: React.FC<CommonItemProps> = ({ c, onUserClick, ...arg }) => {
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
        <Avatar
          src={c.user_info?.image}
          size={32}
          style={{ cursor: c.user_info?.user_id ? 'pointer' : 'default' }}
          onClick={() => {
            if (!c.user_info?.user_id) return;
            onUserClick?.(c.user_info);
          }}
        >
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
            <span
              style={{ fontWeight: "bolder", cursor: c.user_info?.user_id ? 'pointer' : 'default' }}
              onClick={() => {
                if (!c.user_info?.user_id) return;
                onUserClick?.(c.user_info);
              }}
            >
              {c.user_info?.nickname}
            </span>
            <span style={{ color: "#999", fontSize: 12 }}>
              {formatTime(c.create_time)}
            </span>
          </div>
          
          <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
            {c.content}
          </div>
          {Array.isArray(c.pictures) && c.pictures.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Image.PreviewGroup>
                {c.pictures.map((pic: any, idx: number) => {
                  const list = Array.isArray(pic.info_list) ? pic.info_list : [];
                  const preferred = list.find((it: any) => /ND_PRV|WB_PRV/.test(it.image_scene))
                    || list.find((it: any) => /ND_DFT|WB_DFT/.test(it.image_scene));
                  const url = preferred?.url || pic.url_default || pic.url_pre || '';
                  if (!url) return null;
                  return (
                    <Image
                      key={idx}
                      src={url}
                      alt={c.id + '_' + idx}
                      style={{ maxWidth: 120, borderRadius: 6, objectFit: 'cover' }}
                    />
                  );
                })}
              </Image.PreviewGroup>
            </div>
          )}
          
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
