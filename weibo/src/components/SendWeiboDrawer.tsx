/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-18 15:57:18
 * @LastEditTime: 2025-09-10 10:26:06
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\components\SendWeiboDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { useState } from "react";
import { Drawer, Button, Input, Form, Select, Upload } from "antd";
import { SendOutlined, PlusOutlined } from "@ant-design/icons";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import { weiboSendParams } from "../types";
import { fileToBase64 } from "../utils";
import { useMessageHandler } from "../hooks/useMessageHandler";
import { uploadType } from "../../../type";

interface SendWeiboDrawerProps {
  open: boolean;
  onClose: () => void;
  onSend: (content: weiboSendParams) => void;
  loading?: boolean;
}

const { TextArea } = Input;
const { Option } = Select;

const visibleOptions = [
  { label: "公开", value: 0 },
  { label: "自己", value: 1 },
  { label: "好友圈", value: 6 },
  { label: "粉丝", value: 10 },
];

const SendWeiboDrawer: React.FC<SendWeiboDrawerProps> = ({
  open,
  onClose,
  onSend,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const { messageApi, contextHolder, sendMessage } = useVscodeMessage();
  const [fileList, setFileList] = useState<any[]>([]);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [pictureList, setPictureList] = useState<
    { type: string; pid: string; uid: string }[]
  >([]);
  const SENDSOURCE = 'SENDSOURCE'

  const handlers = {
    SENDUPLOADIMGURL: (payload: any) => {
      messageApi.destroy("GETUPLOADIMGURL");
      setLoadingUpload(false);
      if (payload.code === "A00006") {
        messageApi.success("上传图片成功!");
        const obj = {
          type: payload.type,
          uid: payload.uid,
          pid: payload.data.pics.pic_1.pid,
        };
        setPictureList((list) => [...list, obj]);
      } else {
        messageApi.error("上传失败");
        const uid = payload.uid;
        setFileList((fileList) =>
          fileList.filter((file) => file.uid !== uid)
        );
      }
    },
  };

  useMessageHandler(handlers);

  const handleSend = () => {
    form
      .validateFields()
      .then((values) => {
        const obj = {
          content: values.content,
          visible: values.visible,
          vote: "",
          media: "",
          pic_id: JSON.stringify(
            pictureList.map((item) => {
              return {
                type: item.type,
                pid: item.pid,
              };
            })
          ), // 这里可根据实际需求处理
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
  const handleUpload = async (file: any) => {
    const base64 = await fileToBase64(file);
    const obj = {
      base64,
      name: file.name,
      type: file.type,
      size: file.size,
      uid: file.uid,
    } as uploadType;
    setLoadingUpload(true);
    sendMessage("GETUPLOADIMGURL", JSON.stringify(obj),'上传图片中...',SENDSOURCE);
    return Promise.reject(obj);
  };

  const closeFunc = () => {
    form.resetFields();
    setFileList([]);
    setPictureList([]);
    setLoadingUpload(false);
    messageApi.destroy("GETUPLOADIMGURL");
    onClose();
  };

  return (
    <>
      {contextHolder}
      <Drawer
        title="发送微博"
        placement="top"
        height={"auto"}
        open={open}
        onClose={closeFunc}
        destroyOnHidden
        extra={
          <Button
            icon={<SendOutlined />}
            loading={loading}
            onClick={handleSend}
            variant="filled"
            color="default"
          >
            发送
          </Button>
        }
        
      >
        <Form form={form} layout="vertical" initialValues={{ visible: 0 }}>
          <Form.Item
            label="微博正文"
            name="content"
            rules={[{ required: true, message: "请输入微博内容" }]}
          >
            <TextArea
              rows={4}
              maxLength={280}
              showCount
              placeholder="此刻你想说点什么..."
              disabled={loading}
              variant="filled"
            />
          </Form.Item>
          <Form.Item
            label="对谁可见"
            name="visible"
            rules={[{ required: true, message: "请选择可见范围" }]}
          >
            <Select disabled={loading} variant="filled">
              {visibleOptions.map((opt) => (
                <Option value={opt.value} key={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="上传图片">
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={handleUpload}
              onChange={({ fileList: newFileList }) => {
                setFileList(newFileList);
                // 删除pictureList中已被移除的图片
                setPictureList((prevList) => {
                  // 只保留还在fileList中的pid
                  const remainNames = newFileList.map((f) => f.uid);
                  return prevList.filter((item) =>
                    remainNames.includes(item.uid)
                  );
                });
              }}
              multiple
              maxCount={9}
              disabled={loadingUpload}
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

export default SendWeiboDrawer;
