import { Avatar, Button, Flex, Space } from "antd";
import { xItem, xUser } from "../../../types/x";
import YImg from "./YImg";
import dayjs from "dayjs";
import React from "react";

interface XCardHeaderProps {
  item: xItem;
  onUserClick: (userInfo: xUser) => void;
  showActions?: boolean;
  onFollow?: (userInfo?: xUser) => void;
  cancelFollow?: (userInfo?: xUser) => void;
}

const XCardHeader: React.FC<XCardHeaderProps> = ({
  item,
  onUserClick,
  showActions,
  onFollow,
  cancelFollow,
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
};

export default XCardHeader;
