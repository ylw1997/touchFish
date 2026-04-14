
import { Avatar, Button, Dropdown, Flex, Space } from "antd";
import { weiboItem, weiboUser } from "../../../types/weibo";
import YImg from "./YImg";
import dayjs from "dayjs";
import {
  DeleteOutlined,
  DownCircleOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import React from "react";

interface WeiboCardHeaderProps {
  item: weiboItem;
  onUserClick: (userInfo: weiboUser) => void;
  showActions?: boolean;
  onFollow?: (userInfo?: weiboUser) => void;
  cancelFollow?: (userInfo?: weiboUser) => void;
  onCopyLink?: (url: string) => void;
}

const WeiboCardHeader: React.FC<WeiboCardHeaderProps> = ({
  item,
  onUserClick,
  showActions,
  onFollow,
  cancelFollow,
  onCopyLink,
}) => {
  return (
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
            <span dangerouslySetInnerHTML={{ __html: item.source }}></span>
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
                    key: "cancelFollow",
                    label: "取消关注",
                    icon: <DeleteOutlined />,
                    onClick: () => cancelFollow?.(item.user),
                  },
                ],
              }}
            >
              <DownCircleOutlined />
            </Dropdown>
          </span>
        ))}
    </Flex>
  );
};

export default WeiboCardHeader;
