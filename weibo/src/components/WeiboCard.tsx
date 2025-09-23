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
  DeleteOutlined,
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
import React, { useEffect, useState } from "react";
import { parseH5WeiboText, parseWeiboText } from "../utils/textParser";
import TextArea from "antd/es/input/TextArea";

export interface weiboBaseActions {
  className?: string;
  getUserByName: (username: string) => void;
  is_child?: boolean;
  onUserClick: (userInfo: weiboUser) => void;
  onFollow?: (userInfo?: weiboUser) => void;
  cancelFollow?: (userInfo?: weiboUser) => void;
  onExpandLongWeibo?: (id: string | number) => void;
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
  onTopicClick: (topic: string) => void;
}

export interface WeiboCardProps extends weiboBaseActions {
  item: weiboItem;
  isH5?: boolean;
}

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
  onTopicClick,
  isH5 = false, // 是否是H5端
}) => {
  const [form] = Form.useForm();

  const [commentType, setCommentType] = useState<"comment" | "repost">();

  const commentTitle = commentType === "comment" ? "评论" : "转发";

  const [imgShow, setImgShow] = useState(showImg);

  useEffect(() => {
    setImgShow(showImg);
  }, [showImg]);


  const renderTitle = () => (
    <Flex justify="space-between" align="center">
      <Space>
        <Avatar
          size={40}
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
            onClick={() => {
              if (onUserClick && item.user) {
                onUserClick(item.user);
              }
            }}
          >
            {item.user?.screen_name}
          </span>
          <div className="info">
            <span>{dayjs(item.created_at).fromNow()}</span>
            <span>{item.region_name?.replace("发布于", "")}</span>{" "}
            <span dangerouslySetInnerHTML={{__html: item.source}} ></span>
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
          <span className="more">
          <Dropdown
            trigger={["hover"]}
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
                {
                  key:'cancelFollow',
                  label: "取消关注",
                  icon: <DeleteOutlined /> ,
                  onClick: () => cancelFollow?.(item.user),
                }
              ],
            }}
          >
            <DownCircleOutlined />
          </Dropdown>
        </span>
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
              mediaType="video"
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
    if (isH5) {
      if (!item.pics) return null;
      return (
        <div className="imglist h5image-list">
          <Image.PreviewGroup>
            {item.pics.map((pic: any) => {
              const imgProps = {
                className: item.pics!.length > 1 ? "img-item" : "img-only-item",
                src: pic.url,
              };
              return (
                <div key={pic.url}>
                  <YImg {...imgProps} />
                </div>
              );
            })}
          </Image.PreviewGroup>
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
      className="border-top-divider action-bar"
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

  const hasVideo =
    item.page_info &&
    (item.page_info.object_type === "video" ||
      item.page_info.object_type === "live");

  return (
    <Card key={item.id} title={renderTitle()} className={className}>
      <div className="content">
        {isH5
          ? item.text_raw
            ? parseWeiboText(item, getUserByName, onTopicClick)
            : parseH5WeiboText(item.text, getUserByName, onTopicClick)
          : parseWeiboText(item, getUserByName, onTopicClick)}
        {item.isLongText && (
          <Tag
            color="blue"
            style={{ marginLeft: "8px" }}
            className="link-tag"
            onClick={() => onExpandLongWeibo?.(isH5 ? item.bid : item.mblogid)}
            bordered={false}
          >
            展开长微博
          </Tag>
        )}
      </div>
      {imgShow && renderImages()}
      {/* 如果showImg为false,出现一个显示图片按钮,点击显示 */}
      {!imgShow && (item.pic_infos || (isH5 && item.pics) || hasVideo) && (
        <Button
          color="default"
          variant="filled"
          onClick={() => {
            setImgShow(true);
          }}
          style={{
            marginLeft: "8px",
            marginBottom: "8px",
          }}
          size="middle"
        >
          显示{hasVideo ? "视频" : "图片"}
        </Button>
      )}
      
      {renderActionBar()}
      {commentType && (
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
      )}
      {item.comments && (
        <>
          {renderComments(
            item.comments,
            false,
            getUserByName,
            onUserClick,
            onTopicClick
          )}
        </>
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
          onTopicClick={onTopicClick}
        />
      )}
    </Card>
  );
};

export default React.memo(WeiboCard);
