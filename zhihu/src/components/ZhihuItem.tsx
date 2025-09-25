import { Card, Flex, List } from "antd";
import {
  LikeOutlined,
  MessageOutlined,
  DownOutlined,
  UpOutlined,
  FireOutlined,
  LikeFilled,
  ShareAltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import React, { useMemo, useRef, useState } from "react";
import CommentItem from "./CommentItem";
import { parseZhihuItemContent } from "../utils/textParser";
import type { ZhihuCommentItem, ZhihuItemData } from "../../../type";
import { Avatar } from "@heroui/react";
import useZhihuAction from "../hooks/useZhihuAction";

export interface ZhihuItemProps {
  item: ZhihuItemData;
  openQuestionDetailDrawer?: (questionId: string, title: string) => void;
  isDetail?: boolean;
  handleVote: (answerId: string, type: "up" | "neutral") => void;
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
  const [expanded, setExpanded] = useState(!isLoneContent);
  const [comments, setComments] = useState<ZhihuCommentItem[]>([]);
  const [showComments, setShowComments] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { getZhihuComment, contextHolder, copyLink } = useZhihuAction();

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

  const getComments = async () => {
    if (showComments) {
      setShowComments(false);
      backToView();
      return;
    }
    setShowComments(true);
    if (comments.length > 0) return;
    const fetchedComments = await getZhihuComment(item.id);
    if (fetchedComments) {
      setComments(fetchedComments);
    }
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
          name={item.index + ""}
        />
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
      <span
        className="link"
        key="voteup"
        onClick={() =>
          handleVote(
            item.id,
            item.vote_next_step === "unvote" ? "neutral" : "up"
          )
        }
      >
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
            <DownOutlined /> 全文
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

  // 添加分享按钮
  actions.push(
    <span
      className="link"
      key="share"
      onClick={() => {
        // 构造知乎内容的链接
        let url = "";
        if (item.tab === "follow" || item.tab === "recommend") {
          // 对于回答，使用问题ID和回答ID构建链接
          url = `https://www.zhihu.com/question/${item.question?.id}/answer/${item.id}`;
        } else {
          // 对于问题类型（包括热门、热榜等），直接使用问题ID
          url = `https://www.zhihu.com/question/${item.question?.id}`;
        }
        // 使用useZhihuAction中的copyLink函数
        copyLink(url, item.question?.title || item.title);
      }}
    >
      <ShareAltOutlined /> 分享
    </span>
  );

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
          {item.image_area && !isDetail ? <img src={item.image_area} /> : <></>}
        </div>
        {showComments && (
          <List
            className="comment-list"
            itemLayout="horizontal"
            dataSource={comments}
            renderItem={(comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="ant-list-item"
                style={{
                  display: "block",
                  padding: "0",
                }}
              >
                <CommentItem comment={comment} />
              </motion.div>
            )}
            header={<h3>评论</h3>}
          />
        )}
      </Card>
    </div>
  );
};

export default React.memo(ZhihuItem);
