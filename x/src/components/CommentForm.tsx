
import { Button, Flex, Form, Input } from "antd";
import { weiboItem } from "../../../types/weibo";
import React from "react";

const { TextArea } = Input;

interface CommentFormProps {
  item: weiboItem;
  commentType: "comment" | "repost";
  onCommentOrRepost?: (
    content: string,
    item: weiboItem,
    type: "comment" | "repost"
  ) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ item, commentType, onCommentOrRepost }) => {
  const [form] = Form.useForm();
  const commentTitle = commentType === "comment" ? "评论" : "转发";

  const handleSubmit = (values: any) => {
    onCommentOrRepost?.(values.content, item, commentType!);
    form.resetFields();
  };

  return (
    <div
      className="border-top-divider"
      style={{
        padding: "8px 8px 0px",
      }}
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          label={commentTitle}
          name="content"
          rules={[
            {
              required: commentType == "comment" ? true : false,
              message: `请输入${commentTitle}内容`,
            },
          ]}
        >
          <TextArea
            maxLength={140}
            placeholder={`请输入${commentTitle}内容`}
            variant="filled"
            autoSize
          />
        </Form.Item>
        <Form.Item>
          <Flex justify="end">
            <Button variant="filled" htmlType="submit" color="default">
              {commentTitle}
            </Button>
          </Flex>
        </Form.Item>
      </Form>
    </div>
  );
};

export default CommentForm;
