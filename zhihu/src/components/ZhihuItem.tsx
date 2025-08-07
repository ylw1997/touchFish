import {
  Avatar,
  Card,
  Flex,
  Space,
} from "antd";
import {
  LikeOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import React from "react";
import type { ZhihuItemData } from "../../../type";

export interface ZhihuItemProps {
  item: ZhihuItemData;
}

const ZhihuItem: React.FC<ZhihuItemProps> = ({ item }) => {
  const renderTitle = () => (
    <Flex justify="space-between" align="center">
      <Space>
        <Avatar
          size={40}
          style={{ border: "none" }}
          src={item.author?.avatar_url}
        >
          {item.author?.name}
        </Avatar>
        <div>
          <span
            className={"nick-name"}
            style={{ fontSize: 16 }}
          >
            {item.author?.name}
          </span>
          <div className="info">
            <span>{dayjs.unix(item.created_time).fromNow()}</span>
          </div>
        </div>
      </Space>
    </Flex>
  );

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
        <span className="link">
          <LikeOutlined /> {item.voteup_count}
        </span>
        <span className="link">
          <MessageOutlined /> {item.comment_count}
        </span>
      </Flex>
    </div>
  );

  return (
    <Card
      key={item.id}
      title={renderTitle()}
      style={{
        background: "#191919",
      }}
    >
      <div className="content">
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>{item.question!.title}</h2>
        <div dangerouslySetInnerHTML={{ __html: item.excerpt }}></div>
      </div>
      {renderActionBar()}
    </Card>
  );
};

export default React.memo(ZhihuItem);
