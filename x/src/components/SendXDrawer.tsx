/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-18 15:57:18
 * @LastEditTime: 2025-09-22 13:00:00
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\x\src\components\SendXDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { useState } from "react";
import { Drawer, Button, Input, Form, Upload } from "antd";
import { SendOutlined, PlusOutlined } from "@ant-design/icons";
import { xSendParams } from "../types";
import { fileToBase64 } from "../utils";
import { uploadType } from "../../../types/x";
import useXAction from "../hooks/useXAction";

interface SendXDrawerProps {
  open: boolean;
  onClose: () => void;
  onSend: (content: xSendParams) => void;
  loading?: boolean;
}

const { TextArea } = Input;

// Remove visibility options as they are not used in X

const SendXDrawer: React.FC<SendXDrawerProps> = ({
  open,
  onClose,
  onSend,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [pictureList, setPictureList] = useState<
    { type: string; pid: string; uid: string }[]
  >([]);
  const { uploadImage, messageApi } = useXAction();

  const handleSend = () => {
    form
      .validateFields()
      .then((values) => {
        const obj: xSendParams = {
          content: values.content,
          visible: 0 as any,
          vote: "",
          media: "",
          pic_id: JSON.stringify(
            pictureList.map((item) => {
              return {
                type: item.type,
                pid: item.pid,
              };
            }),
          ),
        };
        onSend(obj);
        form.resetFields();
        setFileList([]);
        setPictureList([]);
      })
      .catch(() => {
        messageApi.warning("请填写完整信息");
      });
  };

  // 上传图片
  const handleUpload = async (options: any) => {
    const { onSuccess, onError, file } = options;
    const base64 = await fileToBase64(file);
    const obj = {
      base64,
      name: file.name,
      type: file.type,
      size: file.size,
      uid: file.uid,
    } as uploadType;
    try {
      const result = await uploadImage(obj);
      messageApi.success("上传图片成功!");
      const newPic = {
        type: file.type || "image/png",
        uid: file.uid,
        pid: result.data.pic_id || result.data.pics?.pic_1?.pid,
      };
      setPictureList((list) => [...list, newPic]);
      onSuccess(result, file);
    } catch (err) {
      messageApi.error("上传图片失败");
      onError(err as Error);
    }
  };

  const closeFunc = () => {
    form.resetFields();
    setFileList([]);
    setPictureList([]);
    onClose();
  };

  return (
    <>
      <Drawer
        title="发布推文 (X)"
        placement="top"
        height={"auto"}
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
            icon={<SendOutlined />}
            loading={loading}
            onClick={handleSend}
          >
            发送
          </Button>
        }
      >
        <Form form={form} layout="vertical" initialValues={{ visible: 0 }}>
          <Form.Item
            label="推文正文"
            name="content"
            rules={[{ required: true, message: "请输入推文内容" }]}
          >
            <TextArea
              rows={4}
              maxLength={280}
              showCount
              placeholder="此刻你想说点什么..."
              disabled={loading}
              autoSize={{ minRows: 4, maxRows: 4 }}
            />
          </Form.Item>
          <Form.Item label="上传图片">
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={handleUpload}
              onChange={({ fileList: newFileList }) => {
                setFileList(newFileList);
                // 删除pictureList中已被移除的图片
                setPictureList((prevList) => {
                  const remainNames = newFileList.map((f) => f.uid);
                  return prevList.filter((item) =>
                    remainNames.includes(item.uid),
                  );
                });
              }}
              multiple
              maxCount={9}
            >
              {fileList.length >= 9 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};

export default SendXDrawer;
