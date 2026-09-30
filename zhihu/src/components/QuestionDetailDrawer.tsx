/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 16:55:54
 * @LastEditTime: 2025-10-31 15:40:29
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\components\QuestionDetailDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Drawer, List, Card, Button, Divider, Segmented, FloatButton } from "antd";
import {
  CompressOutlined,
  VerticalAlignTopOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import InfiniteScroll from "react-infinite-scroll-component";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { useHasExpanded, useExpandedStore } from "../store/expanded";
import ZhihuItem from "./ZhihuItem";
import type { ZhihuItemData } from "../../../types/zhihu";
import { loaderFunc } from "../utils/loader";
import type { VoteFnType } from "../hooks/useZhihuAction";

interface QuestionDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  questionData: ZhihuItemData[];
  fetchNext?: (questionId: string) => Promise<void>;
  questionId?: string;
  hasMore?: boolean;
  title: string;
  handleVote: VoteFnType;
  questionDetail: string;
  isFollowing: boolean | undefined;
  followHandler: () => void;
  unfollowHandler: () => void;
  showImg?: boolean;
  questionOrder?: "default" | "updated";
  changeQuestionOrder?: (order: "default" | "updated") => void;
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
  questionOrder = "default",
  changeQuestionOrder,
}) => {
  const hasExpanded = useHasExpanded();
  const collapseAll = useExpandedStore((state) => state.collapseAll);
  const isLongDetail = Boolean(questionDetail && questionDetail.length > 200);
  const [detailExpanded, setDetailExpanded] = useState(false);

  return (
    <Drawer
      getContainer={false}
      title={title}
      onClose={onClose}
      open={open}
      destroyOnHidden
      placement="bottom"
      zIndex={1001}
      height={questionData.length === 0 ? "auto" : "calc(100vh - 150px)"}
      styles={{
        wrapper: {
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
          overflow: "hidden",
        },
        body: {
          padding: "5px",
          height: "100%",
          minHeight: 0,
          overflow: "auto",
        },
      }}
    >
      {questionData.length === 0 && open ? (
        loaderFunc()
      ) : (
        <div
          id="questionDetailScroll"
          style={{ height: "100%", overflow: "auto" }}
        >
          <Card
            title="问题详情"
            size="small"
            extra={
              isLongDetail ? (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setDetailExpanded(!detailExpanded)}
                  icon={detailExpanded ? <UpOutlined /> : <DownOutlined />}
                  style={{ padding: 0 }}
                >
                  {detailExpanded ? "收起描述" : "展开描述"}
                </Button>
              ) : null
            }
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
                    <Button
                      variant="filled"
                      color="default"
                      onClick={() => collapseAll()}
                    >
                      折叠回答
                    </Button>,
                  ]
            }
          >
            <div
              className="question-detail-content"
              style={
                isLongDetail && !detailExpanded
                  ? {
                      maxHeight: "90px",
                      overflow: "hidden",
                      position: "relative",
                      maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
                      WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
                    }
                  : undefined
              }
              dangerouslySetInnerHTML={{
                __html: questionDetail ? questionDetail : title,
              }}
            />
          </Card>
          <Card style={{ marginTop: 10 }} size="small" title="回答排序">
            <Segmented
              style={{}}
              options={[
                {
                  label: <span style={{ padding: "4px 10px" }}>默认排序</span>,
                  value: "default",
                },
                {
                  label: (
                    <span style={{ padding: "4px 10px" }}>按时间(最新)</span>
                  ),
                  value: "updated",
                },
              ]}
              value={questionOrder}
              onChange={(val) =>
                changeQuestionOrder && changeQuestionOrder(val as any)
              }
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

      {/* 详情页高层级悬浮操作按钮，防止被详情页弹窗/抽屉内容挡住 */}
      {open && (
        <>
          <FloatButton
            className="touchfish-detail-collapse-btn"
            style={{
              position: "fixed",
              right: 24,
              bottom: 84,
              zIndex: 1200,
            }}
            onClick={() => collapseAll()}
            icon={<CompressOutlined style={{ color: hasExpanded ? "#a0d911" : undefined }} />}
            tooltip={{ title: "折叠回答", placement: "left" }}
          />
          <FloatButton.BackTop
            style={{
              position: "fixed",
              right: 24,
              bottom: 24,
              zIndex: 1200,
            }}
            visibilityHeight={300}
            duration={500}
            icon={<VerticalAlignTopOutlined />}
            tooltip={{ title: "回到顶部", placement: "left" }}
            target={() =>
              document.getElementById("questionDetailScroll") || window
            }
          />
        </>
      )}
    </Drawer>
  );
};

export default QuestionDetailDrawer;
