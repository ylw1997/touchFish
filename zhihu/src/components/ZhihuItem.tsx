import {
  Avatar,
  Card,
  Flex,
  Space,
} from "antd";
import {
  LikeOutlined,
  MessageOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import React, { useRef, useState } from "react";
import type { ZhihuItemData } from "../../../type";

export interface ZhihuItemProps {
  item: ZhihuItemData;
}
const ZhihuItem: React.FC<ZhihuItemProps> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (expanded && cardRef.current) {
      const cardTop = cardRef.current.getBoundingClientRect().top;
      if (cardTop < 0) {
        cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    setExpanded(!expanded);
  };

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

  const actions = [
    <span className="link" key="voteup">
      <LikeOutlined />  {item.voteup_count} 
    </span>,
    <span className="link" key="comment">
      <MessageOutlined /> {item.comment_count}
    </span>,
    <span className="link" key="expand" onClick={handleToggle}>
      {expanded ? <><UpOutlined /> 收起</> : <><DownOutlined /> 阅读全文</>}
    </span>,
  ];

  return (
    <div ref={cardRef} style={{ scrollMarginTop: '50px' }}>
      <Card
        key={item.id}
        title={renderTitle()}
        style={{
          background: "#191919",
        }}
        actions={actions}
      >
        <div className="content">
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>{item.question!.title}</h2>
          <div dangerouslySetInnerHTML={{ __html: expanded ? item.content : item.excerpt }}></div>
        </div>
      </Card>
    </div>
  );
};

export default React.memo(ZhihuItem);
