import { Card, Flex, List, Button } from "antd";
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
import React, { useMemo, useRef, useState, useEffect } from "react";
import CommentItem from "./CommentItem";
import { parseZhihuItemContent } from "../utils/textParser";
import type { ZhihuCommentItem, ZhihuItemData } from "../../../types/zhihu";
import { Avatar } from "@heroui/react";
import useZhihuAction from "../hooks/useZhihuAction";
import { loaderFunc } from "../utils/loader";
import { useExpandedStore } from "../store/expanded";

export interface ZhihuItemProps {
  item: ZhihuItemData;
  openQuestionDetailDrawer?: (questionId: string, title: string) => void;
  isDetail?: boolean;
  handleVote: (answerId: string, type: "up" | "neutral") => void;
  showImg?: boolean;
}
const ZhihuItem: React.FC<ZhihuItemProps> = ({
  item,
  openQuestionDetailDrawer,
  isDetail,
  handleVote,
  showImg: globalShowImg = true,
}) => {
  const isLoneContent = useMemo(() => {
    return item.content && item.content.length > 2000;
  }, [item.content]);
  const [expanded, setExpanded] = useState(!isLoneContent);
  const register = useExpandedStore(state => state.register);
  const unregister = useExpandedStore(state => state.unregister);
  const [comments, setComments] = useState<ZhihuCommentItem[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { getZhihuComment, copyLink } = useZhihuAction();
  const [overrideShow, setOverrideShow] = useState(false);
  const imagesVisible = globalShowImg || overrideShow;
  const hasImages = useMemo(
    () => (item.content && item.content.includes("<img")) || item.image_area,
    [item.content, item.image_area]
  );

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

  // 折叠自身的回调供全局 collapseAll 使用
  const collapseSelf = () => {
    if (expanded) {
      backToView();
    }
    setExpanded(false);
  };

  // 监听 expanded 状态注册/注销到全局 store
  // 只有长内容且展开时才注册(避免短内容初始展开状态误注册)
  useEffect(() => {
    const id = item.id;
    if (expanded && isLoneContent) {
      register(id, collapseSelf);
    } else {
      unregister(id);
    }
    return () => unregister(id);
  }, [expanded, isLoneContent, item.id, register, unregister]);

  const getComments = async () => {
    if (showComments) {
      setShowComments(false);
      backToView();
      return;
    }
    setShowComments(true);
    if (comments.length > 0) return;
    setCommentsLoading(true);
    const fetchedComments = await getZhihuComment(item.id);
    if (fetchedComments) {
      setComments(fetchedComments);
    }
    setCommentsLoading(false);
  };

  const closeComments = () => {
    // 隐藏评论并把卡片滚回视图
    setShowComments(false);
    backToView();
  };

  const renderTitle = () => (
    <Flex align="center">
      {item.index != undefined ? (
        // 自定义排名徽章（不用 Avatar，避免多位数字被截断）
        <span
          className={`rank-badge ${item.index <= 3 ? `top-${item.index}` : ""}`.trim()}
          aria-label={`排名 ${item.index}`}
        >
          {item.index}
        </span>
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
            <UpOutlined /> 评论
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
            <UpOutlined /> 精简
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
        if (item.tab === "hot" || item.tab === "hot_question") {
          url = `https://www.zhihu.com/question/${item.question?.id}`;
        } else {
          url = `https://www.zhihu.com/question/${item.question?.id}/answer/${item.id}`;
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
      <Card key={item.id} title={renderTitle()} actions={actions}>
        <div
          className={`content ${!imagesVisible ? "hide-images" : ""}`.trim()}
        >
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
          {!globalShowImg &&
            hasImages &&
            (expanded || (item.excerpt && item.excerpt.includes("<img"))) && (
              <Button
                color="default"
                variant="filled"
                onClick={() => setOverrideShow(!overrideShow)}
                size="middle"
              >
                {overrideShow ? "隐藏图片" : "显示图片"}
              </Button>
            )}
        </div>
        {showComments &&
          (commentsLoading ? (
            loaderFunc(2)
          ) : (
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
              header={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ margin: 0 }}>评论</h3>
                  <Button
                    color="default"
                    variant="filled"
                    onClick={closeComments}
                  >
                    <UpOutlined /> 收起评论
                  </Button>
                </div>
              }
            />
          ))}
      </Card>
    </div>
  );
};

export default React.memo(ZhihuItem);
