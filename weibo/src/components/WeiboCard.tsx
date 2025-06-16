import { Avatar, Button, Card, Divider, Flex, Image, Space } from "antd";
import { HeartOutlined, MessageOutlined, ShareAltOutlined } from "@ant-design/icons";
import { weiboItem } from "../../../type";
import YImg from "./YImg";
import dayjs from "dayjs";
import { renderComments } from "./Comment";

interface WeiboCardProps {
  item: weiboItem;
  is_child?: boolean;
  activeKey: string;
  onUserClick?: (screen_name: string, id: number) => void;
  onFollow?: (uid: string, blogId: number) => void;
  onExpandLongWeibo?: (id: string) => void;
  onToggleComments?: (id: number, uid: number) => void;
}

const WeiboCard: React.FC<WeiboCardProps> = ({
  item,
  is_child = false,
  activeKey,
  onUserClick,
  onFollow,
  onExpandLongWeibo,
  onToggleComments,
}) => {
  const defaultImgWidthHeight = is_child ? 150 : 160;
  const defaultAvatarSize = is_child ? 32 : 40;
  const defaultFontSize = is_child ? 14 : 16;

  return (
    <Card
      key={item.id}
      title={
        <Flex justify="space-between" align="center">
          <Space>
            <Avatar
              size={defaultAvatarSize}
              style={{ border: "none" }}
              src={<YImg useImg src={item.user.avatar_large} />}
            />
            <div>
              <span
                className={activeKey !== "userblog" ? "nick-name" : ""}
                style={{ fontSize: defaultFontSize }}
                onClick={() => {
                  if (activeKey !== "userblog" && onUserClick) {
                    onUserClick(item.user.screen_name, item.user.id);
                  }
                }}
              >
                {item.user.screen_name}
              </span>
              <div className="info">
                <span>{dayjs(item.created_at).fromNow()}</span>{" "}
                <span>{item.region_name?.replace("发布于", "")}</span>
              </div>
            </div>
          </Space>
          {item.followBtnCode && (
            <Button
              color="primary"
              onClick={() => onFollow?.(item.followBtnCode!.uid, item.id)}
              variant="filled"
            >
              关注
            </Button>
          )}
        </Flex>
      }
    >
      {/* 微博正文 */}
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
      ></div>
      {/* 图片列表 */}
      {item.pic_infos && item.pic_ids && (
        <div className="imglist">
          <Image.PreviewGroup>
            {item.pic_ids.map(
              (pic: string) =>
                item.pic_infos[pic] && (
                  <YImg
                    width={item.pic_ids.length > 1 ? defaultImgWidthHeight : undefined}
                    height={item.pic_ids.length > 1 ? defaultImgWidthHeight : undefined}
                    className="img-item"
                    key={pic}
                    src={
                      item.pic_infos[pic].large
                        ? item.pic_infos[pic].large.url
                        : item.pic_infos[pic].bmiddle.url
                    }
                  />
                )
            )}
          </Image.PreviewGroup>
        </div>
      )}
      {/* 转发微博 */}
      {item.retweeted_status && (
        <WeiboCard
          item={item.retweeted_status}
          is_child={true}
          activeKey={activeKey}
          onUserClick={onUserClick}
          onFollow={onFollow}
          onExpandLongWeibo={onExpandLongWeibo}
          onToggleComments={onToggleComments}
        />
      )}
      {/* 操作栏 */}
      {!is_child && (
        <div className="info mt10">
          <Flex justify="space-around" align="center">
            <span className="link">
              <ShareAltOutlined /> {item.reposts_count}
            </span>
            <span
              className="link"
              onClick={() => onToggleComments?.(item.id, item.user.id)}
            >
              <MessageOutlined /> {item.comments_count}
            </span>
            <span className="link">
              <HeartOutlined /> {item.attitudes_count}
            </span>
          </Flex>
        </div>
      )}
      {/* 评论区 */}
      {item.comments && (
        <>
          <Divider />
          {renderComments(item.comments)}
        </>
      )}
    </Card>
  );
};

export default WeiboCard; 