/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-04-13
 * @Description: 小红书发布笔记抽屉组件
 */
import { useState } from "react";
import { Drawer, Button, Input, Form, Upload, Spin } from "antd";
import { SendOutlined, PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

interface XhsSendDrawerProps {
  open: boolean;
  onClose: () => void;
  onSend: (params: { title: string; content: string; images: string[] }) => void;
  onUploadImage: (file: File) => Promise<{ url: string }>;
  loading?: boolean;
}

const { TextArea } = Input;

const XhsSendDrawer: React.FC<XhsSendDrawerProps> = ({
  open,
  onClose,
  onSend,
  onUploadImage,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // 小红书图片笔记上限为 18 张
  const MAX_IMAGE_COUNT = 18;
  const MIN_IMAGE_COUNT = 1;

  const handleSend = async () => {
    try {
      const values = await form.validateFields();

      if (uploadedImages.length < MIN_IMAGE_COUNT) {
        throw new Error(`请至少上传 ${MIN_IMAGE_COUNT} 张图片`);
      }

      onSend({
        title: values.title,
        content: values.content,
        images: uploadedImages,
      });

      // 重置表单
      form.resetFields();
      setFileList([]);
      setUploadedImages([]);
    } catch (error: any) {
      // 表单验证失败或图片数量不足
      if (error.message) {
        console.error(error.message);
      }
    }
  };

  const handleUpload = async (options: any) => {
    const { onSuccess, onError, file } = options;
    setUploading(true);

    try {
      const result = await onUploadImage(file);
      setUploadedImages((prev) => [...prev, result.url]);
      onSuccess(result);
    } catch (err) {
      onError(err);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList);
  };

  const handleRemove = (file: UploadFile) => {
    const index = fileList.findIndex((f) => f.uid === file.uid);
    if (index !== -1) {
      setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    }
    return true;
  };

  const closeFunc = () => {
    form.resetFields();
    setFileList([]);
    setUploadedImages([]);
    onClose();
  };

  return (
    <>
      <Spin spinning={uploading} tip="上传中...">
        <Drawer
          title="发布小红书"
          placement="top"
          height="auto"
          open={open}
          onClose={closeFunc}
          destroyOnHidden
          styles={{
            body: {
              padding: "16px",
            },
          }}
          extra={
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading}
              onClick={handleSend}
            >
              发送
            </Button>
          }
        >
          <Form form={form} layout="vertical">
            {/* 标题 */}
            <Form.Item
              label="标题"
              name="title"
              rules={[{ required: true, message: "请输入标题" }]}
            >
              <Input
                maxLength={50}
                showCount
                placeholder="给你的笔记起个标题..."
                disabled={loading}
              />
            </Form.Item>

            {/* 正文 */}
            <Form.Item
              label="正文"
              name="content"
              rules={[{ required: true, message: "请输入正文内容" }]}
            >
              <TextArea
                rows={6}
                maxLength={2000}
                showCount
                placeholder="分享你的心得体会..."
                disabled={loading}
                autoSize={{ minRows: 6, maxRows: 10 }}
              />
            </Form.Item>

            {/* 上传图片 */}
            <Form.Item
              label="上传图片"
              required
              validateStatus={uploadedImages.length < MIN_IMAGE_COUNT ? "error" : undefined}
              help={uploadedImages.length < MIN_IMAGE_COUNT ? `请至少上传 ${MIN_IMAGE_COUNT} 张图片` : undefined}
            >
              <Upload
                listType="picture-card"
                fileList={fileList}
                customRequest={handleUpload}
                onChange={handleChange}
                onRemove={handleRemove}
                multiple
                maxCount={MAX_IMAGE_COUNT}
                accept="image/*"
              >
                {fileList.length >= MAX_IMAGE_COUNT ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>上传</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Form>
        </Drawer>
      </Spin>
    </>
  );
};

export default XhsSendDrawer;
