/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-23 15:10:00
 * @LastEditTime: 2025-10-23 15:10:00
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\components\FeedDetailDrawer.tsx
 * @Description: 小红书笔记详情 Drawer，展示标题/作者/正文/图片（简单版）
 */
import React from 'react';
import { Drawer, Avatar, Image, Flex, Typography, Divider } from 'antd';

const { Title, Paragraph, Text } = Typography;

interface FeedDetailDrawerProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  detail?: any; // 后端返回的笔记详情结构（暂未完整类型）
}

// 约定 detail.note 对象结构含有以下字段：title, desc, user, image_list
// 如果后端返回结构差异，可根据实际字段调整。
export const FeedDetailDrawer: React.FC<FeedDetailDrawerProps> = ({ open, onClose, detail, loading }) => {
  // 后端直接返回 items[0]，其中真实笔记在 note_card 字段；兼容老格式 detail.note 或直接的 note 对象
  const note = detail?.note || detail?.note_card || detail; // 容错
  // image 对象可能包含 info_list/url_default/url_pre/url，优先使用 info_list 中的 WB_DFT/WB_PRV
  const images: string[] = (note?.image_list || []).map((i: any) => {
    if (Array.isArray(i.info_list)) {
      const dft = i.info_list.find((it: any) => it.image_scene === 'WB_DFT' || it.image_scene === 'ND_DFT');
      const prv = i.info_list.find((it: any) => it.image_scene === 'WB_PRV' || it.image_scene === 'ND_PRV');
      if (dft?.url) return dft.url;
      if (prv?.url) return prv.url;
    }
    return i.url_default || i.url_pre || i.url || '';
  }).filter(Boolean);
  const title: string = note?.title || note?.display_title || '';
  const user = note?.user || detail?.user || {};
  const userName: string = user?.nickname || user?.nick_name || '';
  const avatar: string = user?.avatar || '';
  const desc: string = note?.desc || '';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="bottom"
      destroyOnClose
      height="80vh"
      title={title || '笔记详情'}
      styles={{
        body: {
          padding: 0,
          height: '100%',
          overflow: 'auto'
        }
      }}
    >
      <div style={{ padding: 16 }}>
        <Flex align="center" gap={12} style={{ marginBottom: 12 }}>
          <Avatar src={avatar} size={48}>{userName?.[0]}</Avatar>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text style={{ fontWeight: 600 }}>{userName}</Text>
            {user?.desc && <Text type="secondary" style={{ fontSize: 12 }}>{user.desc}</Text>}
          </div>
        </Flex>
        <Title level={5} style={{ marginTop: 0 }}>{title}</Title>
        {desc && <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{desc}</Paragraph>}
        {loading && (
          <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>加载中...</div>
        )}
        {!!images.length && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {images.map((url, idx) => (
                <Image
                  key={idx}
                  src={url}
                  alt={title}
                  style={{ objectFit: 'cover', width: '100%', maxHeight: 260 }}
                  loading="lazy"
                />
              ))}
            </div>
          </>
        )}
        {!loading && !images.length && !desc && (
          <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>暂无更多内容</div>
        )}
      </div>
    </Drawer>
  );
};

export default FeedDetailDrawer;
