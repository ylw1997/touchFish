import { Modal, Input, Button, Space } from "antd";
import { useState } from "react";

interface CookieModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (cookie: string) => Promise<void>;
}

export default function CookieModal({ visible, onCancel, onSave }: CookieModalProps) {
  const [cookie, setCookie] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!cookie.trim()) return;
    setLoading(true);
    try {
      await onSave(cookie);
      setCookie("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="设置抖音 Cookie"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel} disabled={loading}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSave}>
          保存
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div>
          请粘贴您在浏览器登录 <b>douyin.com</b> 后，通过控制台（F12）的网络请求中抓取到的 <b>Cookie</b> 字符串。
        </div>
        <Input.TextArea
          rows={6}
          placeholder="sessionid=xxx; ttwid=xxx; ..."
          value={cookie}
          onChange={(e) => setCookie(e.target.value)}
        />
      </Space>
    </Modal>
  );
}
