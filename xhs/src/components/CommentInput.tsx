/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-11-20
 * @Description: 评论输入组件
 */
import React, { useState } from 'react';
import { Card, Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface CommentInputProps {
  /** 发送评论回调 */
  onSubmit: (content: string) => Promise<boolean|undefined>;
  /** 是否正在发送 */
  loading?: boolean;
  /** 占位文本 */
  placeholder?: string;
}

/**
 * 评论输入组件
 * 提供输入框和发送按钮
 */
export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  loading = false,
  placeholder = '写下你的评论...',
}) => {
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;
    
    const success = await onSubmit(content);
    if (success) {
      setContent('');
    }
  };


  return (
    <Card 
      size="small" 
      title="发表评论"
      style={{ marginTop: 16, marginBottom: 16 }}
    >
      <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={loading}
          style={{ resize: 'none' }}
        />
      <div style={{ 
        marginTop: 12, 
        textAlign: 'right' 
      }}>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          loading={loading}
          disabled={!content.trim() || loading}
        >
          发送
        </Button>
      </div>
    </Card>
  );
};

export default CommentInput;
