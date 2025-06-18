import { Avatar, Button, Card, Flex, Image, Space } from "antd";
import {
  HeartOutlined,
  MessageOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { weiboItem, weiboUser } from "../../../type";
import YImg from "./YImg";
import dayjs from "dayjs";
import { renderComments } from "./Comment";
import { CSSProperties } from "react";

interface WeiboCardProps {
  item: weiboItem;
  is_child?: boolean;
  activeKey: string;
  onUserClick?: (userInfo:weiboUser) => void;
  onFollow?: (uid: string, blogId: number) => void;
  onExpandLongWeibo?: (id: string) => void;
  onToggleComments?: (id: number, uid: number,is_retweeted:boolean) => void;
}

// 提取常量配置
const CARD_CONFIG = {
  CHILD: {
    imgSize: 150,
    avatarSize: 32,
    fontSize: 14,
  },
  PARENT: {
    imgSize: 160,
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
  onExpandLongWeibo,
  onToggleComments,
}) => {
  const config = is_child ? CARD_CONFIG.CHILD : CARD_CONFIG.PARENT;

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
          src={<YImg useImg src={item.user.avatar_hd} />}
        />
        <div>
          <span
            className={activeKey !== "userblog" ? "nick-name" : ""}
            style={titleStyles}
            onClick={() => {
              if (activeKey !== "userblog" && onUserClick) {
                onUserClick(item.user);
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
              width: item.pic_ids.length > 1 ? config.imgSize : undefined,
              height: item.pic_ids.length > 1 ? config.imgSize : undefined,
              className: "img-item",
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
    <div className="info mt10" style={{
      borderTop: "1px solid rgb(255 255 255 / 10%)",
      marginLeft: -10,
      marginRight: -10,
      padding: "10px",
    }} >
      <Flex justify="space-around" align="center">
        <span className="link">
          <ShareAltOutlined /> {item.reposts_count}
        </span>
        <span
          className="link"
          onClick={() => onToggleComments?.(item.id, item.user.id,is_child)}
        >
          <MessageOutlined /> {item.comments_count}
        </span>
        <span className="link">
          <HeartOutlined /> {item.attitudes_count}
        </span>
      </Flex>
    </div>
  );

  return (
    <Card key={item.id} title={renderTitle()} style={{
      background:'#141414a6'
    }} >
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
          item={item.retweeted_status}
          is_child={true}
          activeKey={activeKey}
          onUserClick={onUserClick}
          onFollow={onFollow}
          onExpandLongWeibo={onExpandLongWeibo}
          onToggleComments={onToggleComments}
        />
      )}
      {renderActionBar()}
      {item.comments && (
        <>
          {renderComments(item.comments, true)}
        </>
      )}
    </Card>
  );
};

export default WeiboCard;
