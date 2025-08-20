import { Button, Card, Flex, List } from "antd";
import {
  LikeOutlined,
  MessageOutlined,
  DownOutlined,
  UpOutlined,
  FireOutlined,
  LikeFilled,
} from "@ant-design/icons";
import dayjs from "dayjs";
import React, { useMemo, useRef, useState } from "react";
import { useMessageHandler } from "../hooks/useMessageHandler";
import { useVscodeMessage } from "../hooks/useVscodeMessage";
import CommentItem from "./CommentItem";
import { parseZhihuItemContent } from "../utils/textParser";
import type { ZhihuCommentItem, ZhihuItemData } from "../../../type";
import { Avatar } from "@heroui/react";

export interface ZhihuItemProps {
  item: ZhihuItemData;
  openQuestionDetailDrawer?: (questionId: string, title: string) => void;
  isDetail?: boolean;
  handleVote: (answerId: string) => void;
}
const ZhihuItem: React.FC<ZhihuItemProps> = ({
  item,
  openQuestionDetailDrawer,
  isDetail,
  handleVote,
}) => {
  const isLoneContent = useMemo(() => {
    return item.content && item.content.length > 2000;
  }, [item.content]);
  const [expanded, setExpanded] = useState(!isLoneContent); //默认阅读全文
  const [comments, setComments] = useState<ZhihuCommentItem[]>([]);
  const [showComments, setShowComments] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { sendMessage, contextHolder, messageApi } = useVscodeMessage();

  useMessageHandler({
    zhihuComment: (payload) => {
      if (payload.answerId === item.id) {
        messageApi.destroy("getZhihuComment");
        setComments(payload.data);
      }
    },
  });

  const backToView = () => {
    if (cardRef.current) {
      const cardTop = cardRef.current.getBoundingClientRect().top;
      if (cardTop < 0) {
        cardRef.current.scrollIntoView({ behavior: "auto", block: "start" });
      }
    }
  };

  const handleToggle = () => {
    if (expanded) backToView();
    setExpanded(!expanded);
  };

  const getComments = () => {
    if (showComments) {
      setShowComments(false);
      backToView();
      return;
    }
    setShowComments(true);
    if (comments.length > 0) return;
    sendMessage("getZhihuComment", item.id, "获取评论中...", "ZHIHUAPP");
  };

  const renderTitle = () => (
    <Flex align="center">
      {item.index != undefined ? (
        <Avatar
          isBordered
          radius="sm"
          size="sm"
          style={{
            flexShrink: 0,
            fontSize: "20px",
          }}
          name={item.index +''}
        >
        </Avatar>
      ) : (
        <Avatar
          isBordered 
          radius="sm"
          style={{ flexShrink: 0 }}
          src={item.author?.avatar_url}
        >
          {item.author?.name}
        </Avatar>
      )}
      <div style={{ marginLeft: 10 }}>
        <span
          className={"nick-name"}
          onClick={() =>
            openQuestionDetailDrawer?.(item.question!.id, item.question!.title)
          }
        >
          {isDetail ? item.author?.name : item.question!.title}
        </span>
        <div className="info">
          <span>
            {isDetail ? "" : item.author?.name}{" "}
            {item.created_time ? dayjs.unix(item.created_time).fromNow() : ""}
          </span>
        </div>
      </div>
    </Flex>
  );

  const actions = [];
  if (item.voteup_count != undefined) {
    actions.push(
      <span className="link" key="voteup" onClick={() => handleVote(item.id)}>
        {item.vote_next_step === "unvote" ? (
          <LikeFilled style={{ color: "red" }} />
        ) : (
          <LikeOutlined />
        )}{" "}
        {item.voteup_count}
      </span>
    );
  }
  if (item.comment_count != undefined) {
    actions.push(
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
      </span>
    );
  }
  if (isLoneContent) {
    actions.push(
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
      </span>
    );
  }
  if (item.metrics_area) {
    actions.push(
      <span key="metrics">
        <FireOutlined /> {item.metrics_area}
      </span>
    );
  }

  return (
    <div ref={cardRef} style={{ scrollMarginTop: "50px" }}>
      {contextHolder}
      <Card key={item.id} title={renderTitle()} actions={actions}>
        <div className="content">
          {item.content ? (
            parseZhihuItemContent(expanded ? item.content : item.excerpt)
          ) : (
            <div
              dangerouslySetInnerHTML={{
                __html: item.excerpt,
              }}
            ></div>
          )}
          {item.image_area ? <img src={item.image_area} /> : <></>}
        </div>
        {showComments && (
          <List
            className="comment-list"
            itemLayout="horizontal"
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
