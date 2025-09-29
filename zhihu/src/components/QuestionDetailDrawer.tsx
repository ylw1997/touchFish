/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 16:55:54
 * @LastEditTime: 2025-09-29 16:23:37
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\components\QuestionDetailDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Drawer, List, Card, Button, Divider } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";
import { motion } from "framer-motion";
import React from "react";
import ZhihuItem from "./ZhihuItem";
import type { ZhihuItemData } from "../../../type";
import { loaderFunc } from "../utils/loader";

interface QuestionDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  questionData: ZhihuItemData[];
  fetchNext?: (questionId: string) => Promise<void>;
  questionId?: string;
  hasMore?: boolean;
  title: string;
  handleVote: (answerId: string, type: "up" | "neutral") => void;
  questionDetail: string;
  isFollowing: boolean | undefined;
  followHandler: () => void;
  unfollowHandler: () => void;
  showImg?: boolean;
}

const QuestionDetailDrawer: React.FC<QuestionDetailDrawerProps> = ({
  open,
  onClose,
  questionData,
  title,
  handleVote,
  questionDetail,
  isFollowing,
  followHandler,
  unfollowHandler,
  fetchNext,
  questionId,
  hasMore,
  showImg = true,
}) => {
  return (
    <Drawer
      getContainer={false}
      title={title}
      onClose={onClose}
      open={open}
      destroyOnHidden
      placement="bottom"
      height={questionData.length === 0 ? "auto" : "calc(100vh - 150px)"}
      zIndex={1001}
      styles={{
        wrapper: {
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
          overflow: "hidden",
        },
        body: {
          padding: 0,
          height: "100%",
          minHeight: 0,
          overflow: "auto",
        },
      }}
    >
      {questionData.length === 0 && open ? (
        loaderFunc()
      ) : (
        // make the drawer body the scrollable target so InfiniteScroll can detect
        // reaching bottom inside the drawer
        <div
          id="questionDetailScroll"
          style={{ height: "100%", overflow: "auto", padding: "5px" }}
        >
          <Card
            actions={
              isFollowing === undefined
                ? undefined
                : [
                    isFollowing ? (
                      <Button
                        color="red"
                        variant="filled"
                        onClick={unfollowHandler}
                      >
                        取消关注
                      </Button>
                    ) : (
                      <Button
                        variant="filled"
                        color="blue"
                        onClick={followHandler}
                      >
                        关注问题
                      </Button>
                    ),
                  ]
            }
          >
            <div
              className="question-detail-content"
              dangerouslySetInnerHTML={{
                __html: questionDetail ? questionDetail : title,
              }}
            />
          </Card>
          <InfiniteScroll
            dataLength={questionData.length}
            next={() => {
              if (fetchNext && questionId) fetchNext(questionId);
            }}
            endMessage={<Divider plain>没有了🤐</Divider>}
            hasMore={hasMore ?? false}
            loader={loaderFunc()}
            scrollThreshold={0.95}
            scrollableTarget="questionDetailScroll"
          >
            <List
              dataSource={questionData}
              renderItem={(item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <ZhihuItem
                    isDetail
                    item={item}
                    handleVote={handleVote}
                    showImg={showImg}
                  />
                </motion.div>
              )}
            />
          </InfiniteScroll>
        </div>
      )}
    </Drawer>
  );
};

export default QuestionDetailDrawer;
