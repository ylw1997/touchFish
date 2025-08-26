/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 16:55:54
 * @LastEditTime: 2025-08-20 10:16:28
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\components\QuestionDetailDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Drawer, List, Card, Button } from "antd";
import React from "react";
import ZhihuItem from "./ZhihuItem";
import type { ZhihuItemData } from "../../../type";

interface QuestionDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  questionData: ZhihuItemData[];
  setQuestionData: React.Dispatch<React.SetStateAction<ZhihuItemData[]>>;
  title: string;
  voteHandler: (
    answerId: string,
    list: ZhihuItemData[],
    setList: React.Dispatch<React.SetStateAction<ZhihuItemData[]>>
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
  setQuestionData,
  title,
  voteHandler,
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
      height="calc(100vh - 200px)"
      loading={questionData.length === 0 && open}
      zIndex={1001}
      styles={{
        wrapper: {
          background: "none",
          borderRadius: "10px",
          overflow: "hidden",
        },
        body: {
          padding: 5,
          height: "100%",
          minHeight: 0,
          overflow: "auto",
        },
        content: {
          background: "rgba(26, 28, 34, 0.7)",
          backdropFilter: "saturate(180%) blur(15px)",
        },
      }}
    >
      <Card
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          border: "none",
        }}
        actions={[
          isFollowing === undefined ? null : isFollowing ? (
            <Button color="red" variant="filled" onClick={unfollowHandler}>
              取消关注
            </Button>
          ) : (
            <Button variant="filled" color="blue" onClick={followHandler}>
              关注问题
            </Button>
          ),
        ]}
      >
        <div
          className="question-detail-content"
          style={{ color: "white" }}
          dangerouslySetInnerHTML={{
            __html: questionDetail ? questionDetail : title,
          }}
        />
      </Card>
      <List
        dataSource={questionData}
        renderItem={(item) => (
          <ZhihuItem
            isDetail
            item={item}
            handleVote={() =>
              voteHandler(item.id, questionData, setQuestionData)
            }
          />
        )}
      />
    </Drawer>
  );
};

export default QuestionDetailDrawer;
