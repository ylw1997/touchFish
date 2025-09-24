/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 16:55:54
 * @LastEditTime: 2025-09-12 16:48:48
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\components\QuestionDetailDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Drawer, List, Card, Button } from "antd";
import { motion } from "framer-motion";
import React from "react";
import ZhihuItem from "./ZhihuItem";
import type { ZhihuItemData } from "../../../type";
import { loaderFunc } from "../utils/loader";

interface QuestionDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  questionData: ZhihuItemData[];
  title: string;
  handleVote: (
    answerId: string,
    type: "up" | "neutral",
  ) => void;
  questionDetail: string;
  isFollowing: boolean | undefined;
  followHandler: () => void;
  unfollowHandler: () => void;
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
}) => {
  return (
    <Drawer
      getContainer={false}
      title={title}
      onClose={onClose}
      open={open}
      destroyOnHidden
      placement="bottom"
      height={questionData.length === 0 ? "500px" : "calc(100vh - 150px)"}
      zIndex={1001}
      styles={{
        wrapper: {
          borderTopLeftRadius: "10px",
          borderTopRightRadius: "10px",
          overflow: "hidden",
        },
        body: {
          padding: 5,
          height: "100%",
          minHeight: 0,
          overflow: "auto",
        },
      }}
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
                  <Button variant="filled" color="blue" onClick={followHandler}>
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
      {questionData.length === 0 && open ? (
        loaderFunc()
      ) : (
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
              <ZhihuItem isDetail item={item} handleVote={handleVote} />
            </motion.div>
          )}
        />
      )}
    </Drawer>
  );
};

export default QuestionDetailDrawer;
