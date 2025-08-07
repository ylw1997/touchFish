import { Avatar, Card, Flex, Space, List } from "antd";
import {
  LikeOutlined,
  MessageOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import React, { useRef, useState, useEffect } from "react";
import { Button } from "antd";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import CommentItem from "./CommentItem";
import type { ZhihuCommentItem, ZhihuItemData } from "../../../type";

export interface ZhihuItemProps {
  item: ZhihuItemData;
}
const ZhihuItem: React.FC<ZhihuItemProps> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<ZhihuCommentItem[]>([]);
  const [showComments, setShowComments] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { sendMessage, contextHolder, messageApi } = useVscodeMessage();

  const handleToggle = () => {
    if (expanded && cardRef.current) {
      const cardTop = cardRef.current.getBoundingClientRect().top;
      if (cardTop < 0) {
        cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    setExpanded(!expanded);
  };

  const getComments = () => {
    if (showComments) {
      setShowComments(false);
      if (cardRef.current) {
        const cardTop = cardRef.current.getBoundingClientRect().top;
        if (cardTop < 0) {
          cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      return;
    }
    setShowComments(true);
    if (comments.length > 0) return;
    sendMessage("getZhihuComment", item.id, "获取评论中...", "ZHIHUAPP");
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === "zhihuComment" && message.answerId === item.id) {
        messageApi.destroy("getZhihuComment");
        setComments(message.data);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [item.id, messageApi]);

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
          <span className={"nick-name"} style={{ fontSize: 16 }}>
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
      <LikeOutlined /> {item.voteup_count}
    </span>,
    <span className="link" key="comment" onClick={getComments}>
      {showComments ? (
        <span>
          <UpOutlined /> 收起评论
        </span>
      ) : (
        <span>
          <MessageOutlined /> {item.comment_count}
        </span>
      )}
    </span>,
    <span className="link" key="expand" onClick={handleToggle}>
      {expanded ? (
        <>
          <UpOutlined /> 收起
        </>
      ) : (
        <>
          <DownOutlined /> 阅读全文
        </>
      )}
    </span>,
  ];

  return (
    <div ref={cardRef} style={{ scrollMarginTop: "50px" }}>
      {contextHolder}
      <Card
        key={item.id}
        title={renderTitle()}
        style={{
          background: "#191919",
        }}
        actions={actions}
      >
        <div className="content">
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>
            {item.question!.title}
          </h2>
          <div
            dangerouslySetInnerHTML={{
              __html: expanded ? item.content : item.excerpt,
            }}
          ></div>
        </div>
        {showComments && (
          <List
            dataSource={comments}
            renderItem={(comment) => <CommentItem comment={comment} />}
            header={
              <Flex align="center" justify="space-between">
                <h3>评论</h3>
                <Button
                  color="default"
                  variant="filled"
                  onClick={() => setShowComments(false)}
                >
                  <UpOutlined /> 收起评论
                </Button>
              </Flex>
            }
          />
        )}
      </Card>
    </div>
  );
};

export default React.memo(ZhihuItem);
