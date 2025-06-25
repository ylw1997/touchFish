import { Avatar, Button, Card, Dropdown, Flex, Form, Image, Space } from "antd";
import {
  DownCircleOutlined,
  ExportOutlined,
  HeartOutlined,
  MessageOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { weiboItem, weiboUser } from "../../../type";
import YImg from "./YImg";
import dayjs from "dayjs";
import { renderComments } from "./Comment";
import { CSSProperties, useState } from "react";
import TextArea from "antd/es/input/TextArea";

export interface WeiboCardProps {
  className?: string;
  item: weiboItem;
  is_child?: boolean;
  activeKey: string;
  onUserClick?: (userInfo: weiboUser) => void;
  onFollow?: (userInfo?: weiboUser) => void;
  cancelFollow?: (userInfo?: weiboUser) => void;
  onExpandLongWeibo?: (id: string) => void;
  onToggleComments?: (id: number, uid: number, is_retweeted: boolean) => void;
  showActions?: boolean;
  onCopyLink?: (url: string) => void;
  onCommentOrRepost?: (
    content: string,
    item: weiboItem,
    type: "comment" | "repost"
  ) => void;
}

// 提取常量配置
const CARD_CONFIG = {
  CHILD: {
    avatarSize: 32,
    fontSize: 14,
  },
  PARENT: {
    avatarSize: 40,
    fontSize: 16,
  },
} as const;

const WeiboCard: React.FC<WeiboCardProps> = ({
  item,
  is_child = false,
  activeKey,
  onUserClick,
  onFollow,
  cancelFollow,
  onExpandLongWeibo,
  onToggleComments,
  showActions,
  className,
  onCopyLink,
  onCommentOrRepost,
}) => {
  const config = is_child ? CARD_CONFIG.CHILD : CARD_CONFIG.PARENT;

  const [form] = Form.useForm();

  const [commentType, setCommentType] = useState<"comment" | "repost">();

  const commentTitle = commentType === "comment" ? "评论" : "转发";

  // 提取样式对象
  const titleStyles: CSSProperties = {
    fontSize: config.fontSize,
  };

  const renderTitle = () => (
    <Flex justify="space-between" align="center">
      <Space>
        <Avatar
          size={config.avatarSize}
          style={{ border: "none" }}
          src={
            item.user?.avatar_hd && <YImg useImg src={item.user.avatar_hd} />
          }
        >
          {item.user?.screen_name}
        </Avatar>
        <div>
          <span
            className={activeKey !== "userblog" ? "nick-name" : ""}
            style={titleStyles}
            onClick={() => {
              if (activeKey !== "userblog" && onUserClick && item.user) {
                onUserClick(item.user);
              }
            }}
          >
            {item.user?.screen_name}
          </span>
          <div className="info">
            <span>{dayjs(item.created_at).fromNow()}</span>{" "}
            <span>{item.region_name?.replace("发布于", "")}</span>
          </div>
        </div>
      </Space>
      {showActions &&
        item.user &&
        (!item.user?.following ? (
          <Button
            color="primary"
            onClick={() => onFollow?.(item.user)}
            variant="filled"
          >
            关注
          </Button>
        ) : (
          <Button
            color="danger"
            onClick={() => cancelFollow?.(item.user)}
            variant="filled"
          >
            取关
          </Button>
        ))}
    </Flex>
  );

  const renderImages = () => {
    if (!item.pic_infos || !item.pic_ids) return null;

    return (
      <div className="imglist">
        <Image.PreviewGroup>
          {item.pic_ids.map((pic: string) => {
            const picInfo = item.pic_infos[pic];
            if (!picInfo) return null;

            const imgProps = {
              className: item.pic_ids.length > 1 ? "img-item" : "img-only-item",
              key: pic,
              src: picInfo.large ? picInfo.large.url : picInfo.bmiddle.url,
            };

            return <YImg {...imgProps} />;
          })}
        </Image.PreviewGroup>
      </div>
    );
  };

  const renderActionBar = () => (
    <div
      className="info mt10"
      style={{
        borderTop: "1px solid rgb(255 255 255 / 10%)",
        marginLeft: "-8px",
        marginRight: "-8px",
        padding: "8px",
      }}
    >
      <Flex justify="space-around" align="center">
        <span
          className="link"
          style={{
            color:
              commentType === "repost"
                ? "var(--vscode-textLink-foreground)"
                : "",
          }}
          onClick={() =>
            commentType != "repost"
              ? setCommentType("repost")
              : setCommentType(undefined)
          }
        >
          <ExportOutlined /> {item.reposts_count}
        </span>
        <span
          className="link"
          style={{
            color:
              commentType === "comment"
                ? "var(--vscode-textLink-foreground)"
                : "",
          }}
          onClick={() => {
            commentType != "comment"
              ? item.comments
                ? setCommentType(undefined)
                : setCommentType("comment")
              : setCommentType(undefined);
            if (item.user?.id !== undefined) {
              onToggleComments?.(item.id, item.user.id, is_child);
            }
          }}
        >
          <MessageOutlined /> {item.comments_count}
        </span>
        <span className="link">
          <HeartOutlined /> {item.attitudes_count}
        </span>
        <span className="link">
          <Dropdown
            trigger={["click", "hover"]}
            menu={{
              items: [
                {
                  key: "share",
                  label: "分享",
                  icon: <ShareAltOutlined />,
                  onClick: () => {
                    onCopyLink?.(
                      `https://weibo.com/${item.user?.id}/${item.mblogid}`
                    );
                  },
                },
              ],
            }}
          >
            <DownCircleOutlined />
          </Dropdown>
        </span>
      </Flex>
    </div>
  );

  // 发布评论和转发
  const handleSubmit = (values: any) => {
    console.log(values, item);
    onCommentOrRepost?.(values.content, item, commentType!);
  };

  return (
    <Card
      key={item.id}
      title={renderTitle()}
      style={{
        background: "#141414a6",
      }}
      className={className}
    >
      <div
        className="content"
        dangerouslySetInnerHTML={{ __html: item.text }}
        onClick={(e) => {
          if (
            e.target instanceof HTMLSpanElement &&
            e.target.classList.contains("expand") &&
            onExpandLongWeibo
          ) {
            onExpandLongWeibo(item.mblogid);
          }
        }}
      />
      {renderImages()}
      {item.retweeted_status && (
        <WeiboCard
          className="retweeted-status"
          item={item.retweeted_status}
          is_child={true}
          activeKey={activeKey}
          onUserClick={onUserClick}
          onFollow={onFollow}
          cancelFollow={cancelFollow}
          showActions={showActions}
          onExpandLongWeibo={onExpandLongWeibo}
          onToggleComments={onToggleComments}
          onCopyLink={onCopyLink}
        />
      )}
      {renderActionBar()}
      {commentType && (
        <div
          style={{
            borderTop: "1px solid rgb(255 255 255 / 10%)",
            marginLeft: -10,
            marginRight: -10,
            padding: "10px 10px 0",
          }}
        >
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              label={commentTitle}
              name="content"
              rules={[{ required: true, message: `请输入${commentTitle}内容` }]}
            >
              <TextArea
                rows={2}
                maxLength={140}
                showCount
                placeholder={`请输入${commentTitle}内容`}
                style={{ background: "#14141482" }}
              />
            </Form.Item>
            <Form.Item>
              <Button variant="filled" htmlType="submit" type="primary">
                {commentTitle}
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}
      {item.comments && <>{renderComments(item.comments, true)}</>}
    </Card>
  );
};

export default WeiboCard;
