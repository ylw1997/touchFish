/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-18 15:57:18
 * @LastEditTime: 2025-06-20 17:09:28
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\components\SendWeiboDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import React from "react";
import { Drawer, Button, Input, Form, Select, Upload } from "antd";
import { SendOutlined, PlusOutlined } from "@ant-design/icons";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import { weiboSendParams } from "../types";
import { fileToBase64 } from "../utils";
import { commandsType, uploadType } from "../../../type";

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
  const [fileList, setFileList] = React.useState<any[]>([]);
  const [loadingUpload, setLoadingUpload] = React.useState(false);
  const [pictureList, setPictureList] = React.useState<
    { type: string; pid: string }[]
  >([]);

  const msgHandle = React.useCallback(
    async (event: MessageEvent<commandsType<any>>) => {
      const msg = event.data;
      if (msg.command === "SENDUPLOADIMGURL" && msg.payload) {
        messageApi.destroy("GETUPLOADIMGURL");
        setLoadingUpload(false);
        if (msg.payload.code === "A00006") {
          const obj = {
            type: msg.payload.type,
            pid: msg.payload.data.pics.pic_1.pid,
          };
          setPictureList((list) => [...list, obj]);
        } else {
          messageApi.error("上传失败");
          const uid = msg.payload.uid;
          setFileList((fileList) =>
            fileList.filter((file) => file.uid !== uid)
          );
        }
      }
    },
    [messageApi, setLoadingUpload, setPictureList, setFileList]
  );

  // 修复事件监听重复添加问题
  React.useEffect(() => {
    window.addEventListener("message", msgHandle);
    return () => {
      window.removeEventListener("message", msgHandle);
    };
  }, [msgHandle]);

  const handleSend = () => {
    form
      .validateFields()
      .then((values) => {
        onSend({
          content: values.content,
          visible: values.visible,
          vote: "",
          media: "",
          pic_id: JSON.stringify(pictureList), // 这里可根据实际需求处理
        });
        form.resetFields();
        setFileList([]);
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
    } as uploadType;
    setLoadingUpload(true);
    sendMessage("GETUPLOADIMGURL", JSON.stringify(obj));
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
        destroyOnClose
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
        styles={{
          wrapper: {
            background: "none",
            borderRadius: "10px",
            overflow: "hidden",
          },
          body: {
            padding: "10px",
          },
          content: {
            background: "rgba(26, 28, 34, 0.5)",
            backdropFilter: "saturate(180%) blur(15px)",
          },
        }}
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
              style={{ background: "#14141482" }}
            />
          </Form.Item>
          <Form.Item
            label="对谁可见"
            name="visible"
            rules={[{ required: true, message: "请选择可见范围" }]}
          >
            <Select disabled={loading}>
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
              onChange={({ fileList }) => setFileList(fileList)}
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
