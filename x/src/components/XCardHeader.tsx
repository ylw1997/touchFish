
import { Avatar, Button, Dropdown, Flex, Space } from "antd";
import { xItem, xUser } from "../../../types/x";
import YImg from "./YImg";
import dayjs from "dayjs";
import {
  DeleteOutlined,
  DownCircleOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import React from "react";

interface XCardHeaderProps {
  item: xItem;
  onUserClick: (userInfo: xUser) => void;
  showActions?: boolean;
  onFollow?: (userInfo?: xUser) => void;
  cancelFollow?: (userInfo?: xUser) => void;
  onCopyLink?: (url: string) => void;
}

const XCardHeader: React.FC<XCardHeaderProps> = ({
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
            item.user?.avatar_hd ? (
              <YImg useImg src={item.user.avatar_hd} />
            ) : undefined
          }
        >
          {item.user?.screen_name?.[0]?.toUpperCase()}
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
                        `https://x.com/${item.user?.screen_name}/status/${item.mblogid}`
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

export default XCardHeader;
