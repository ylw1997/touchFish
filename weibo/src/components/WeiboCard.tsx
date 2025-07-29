import {
  Avatar,
  Button,
  Card,
  Dropdown,
  Flex,
  Form,
  Image,
  Space,
  Tag,
} from "antd";
import {
  DownCircleOutlined,
  ExportOutlined,
  HeartFilled,
  HeartOutlined,
  MessageOutlined,
  PlayCircleFilled,
  ShareAltOutlined,
} from "@ant-design/icons";
import { weiboItem, weiboUser } from "../../../type";
import YImg from "./YImg";
import dayjs from "dayjs";
import { renderComments } from "./Comment";
import React, { CSSProperties, useEffect, useState } from "react";
import { parseWeiboText } from "../utils/textParser";
import TextArea from "antd/es/input/TextArea";

export interface WeiboCardProps {
  className?: string;
  item: weiboItem;
  getUserByName: (username: string) => void;
  is_child?: boolean;
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
  onLikeOrCancelLike?: (item: weiboItem, type: "like" | "cancel") => void;
  showImg?: boolean;
  onDownloadVideo?: (url: string) => void;
  activeVideoUrl?: string | null;
  onPlayVideo?: (url?: string) => void;
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
  onUserClick,
  onFollow,
  cancelFollow,
  onExpandLongWeibo,
  onToggleComments,
  showActions,
  className,
  onCopyLink,
  onCommentOrRepost,
  onLikeOrCancelLike,
  showImg,
  getUserByName,
  activeVideoUrl,
  onPlayVideo,
}) => {
  const config = is_child ? CARD_CONFIG.CHILD : CARD_CONFIG.PARENT;

  const [form] = Form.useForm();

  const [commentType, setCommentType] = useState<"comment" | "repost">();

  const commentTitle = commentType === "comment" ? "评论" : "转发";

  const [imgShow, setImgShow] = useState(showImg);

  useEffect(() => {
    setImgShow(showImg);
  }, [showImg]);

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
            className={"nick-name"}
            style={titleStyles}
            onClick={() => {
              if (onUserClick && item.user) {
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
            color="default"
            onClick={() => onFollow?.(item.user)}
            variant="filled"
          >
            关注
          </Button>
        ) : (
          <Button
            color="red"
            onClick={() => cancelFollow?.(item.user)}
            variant="filled"
          >
            取关
          </Button>
        ))}
    </Flex>
  );

  const renderImages = () => {
    // 视频封面显示
    if (item.page_info && item.page_info.object_type === "video") {
      const isPlaying = activeVideoUrl === item.page_info.media_info.stream_url;
      if (isPlaying) {
        return (
          <div className="imglist video-cover">
            <YImg
              className="img-only-item video-item"
              src={item.page_info.media_info.stream_url}
            />
          </div>
        );
      }
      return (
        <div className="imglist video-cover">
          <YImg
            className="img-only-item"
            src={item.page_info.page_pic}
            useImg
          />
          <PlayCircleFilled
            className="video-icon"
            onClick={() => onPlayVideo?.(item.page_info?.media_info.stream_url)}
          />
        </div>
      );
    }
    if (!item.pic_infos || !item.pic_ids) return null;
    return (
      <div className="imglist">
        <Image.PreviewGroup>
          {item.pic_ids.map((pic: string) => {
            const picInfo = item.pic_infos[pic];
            if (!picInfo) return null;

            const imgProps = {
              className: item.pic_ids.length > 1 ? "img-item" : "img-only-item",
              src: picInfo.large ? picInfo.large.url : picInfo.bmiddle.url,
            };
            return (
              <div key={pic}>
                <YImg {...imgProps} />
              </div>
            );
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
        {item.attitudes_status == 1 ? (
          <span
            className="link"
            onClick={() => onLikeOrCancelLike?.(item, "cancel")}
          >
            <HeartFilled style={{ color: "red" }} /> {item.attitudes_count}
          </span>
        ) : (
          <span
            className="link"
            onClick={() => onLikeOrCancelLike?.(item, "like")}
          >
            <HeartOutlined /> {item.attitudes_count}
          </span>
        )}
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
    // 清理评论
    form.resetFields();
  };

  const hasVideo = (item.page_info &&
            (item.page_info.object_type === "video" ||
              item.page_info.object_type === "live"));

  return (
    <Card
      key={item.id}
      title={renderTitle()}
      style={{
        background: "#191919",
      }}
      className={className}
    >
      <div className="content">
        {parseWeiboText(item, getUserByName)}
        {item.isLongText && (
          <Tag color="blue" style={{ marginLeft: "8px" }}>
            <a
              onClick={() => onExpandLongWeibo?.(item.mblogid)}
              target="_blank"
              rel="noopener noreferrer"
            >
              展开长微博
            </a>
          </Tag>
        )}
      </div>

      {imgShow && renderImages()}
      {/* 如果showImg为false,出现一个显示图片按钮,点击显示 */}
      {!imgShow &&
        (item.pic_infos ||
          hasVideo) && (
          <Button
            color="default"
            variant="filled"
            onClick={() => {
              setImgShow(true);
            }}
            style={{
              marginTop: "8px",
            }}
            size="middle"
          >
            显示{hasVideo ? '视频' : '图片'}
          </Button>
        )}
      {item.retweeted_status && (
        <WeiboCard
          className="retweeted-status"
          item={item.retweeted_status}
          is_child={true}
          onUserClick={onUserClick}
          onFollow={onFollow}
          cancelFollow={cancelFollow}
          showActions={showActions}
          onExpandLongWeibo={onExpandLongWeibo}
          onToggleComments={onToggleComments}
          onCopyLink={onCopyLink}
          onCommentOrRepost={onCommentOrRepost}
          onLikeOrCancelLike={onLikeOrCancelLike}
          showImg={showImg}
          getUserByName={getUserByName}
          activeVideoUrl={activeVideoUrl}
          onPlayVideo={onPlayVideo}
        />
      )}
      {renderActionBar()}
      {commentType && (
        <div
          style={{
            borderTop: "1px solid rgb(255 255 255 / 10%)",
            marginLeft: "-8px",
            marginRight: "-8px",
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
                rows={3}
                maxLength={140}
                placeholder={`请输入${commentTitle}内容`}
                style={{ background: "#14141482" }}
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
      )}
      {item.comments && (
        <>{renderComments(item.comments, true, getUserByName, onUserClick)}</>
      )}
    </Card>
  );
};

export default React.memo(WeiboCard);
