/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 16:55:54
 * @LastEditTime: 2025-08-12 09:25:08
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\components\QuestionDetailDrawer.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
import { Drawer, List } from "antd";
import React from "react";
import ZhihuItem from "./ZhihuItem";
import type { ZhihuItemData } from "../../../type";

interface QuestionDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  questionData: ZhihuItemData[];
  setQuestionData: React.Dispatch<React.SetStateAction<ZhihuItemData[]>>;
  title: string;
  voteHandler: (answerId: string, list: ZhihuItemData[], setList: React.Dispatch<React.SetStateAction<ZhihuItemData[]>>) => void;
}

const QuestionDetailDrawer: React.FC<QuestionDetailDrawerProps> = ({
  open,
  onClose,
  questionData,
  setQuestionData,
  title,
  voteHandler,
}) => {
  return (
    <Drawer
      title={title}
      onClose={onClose}
      open={open}
      destroyOnHidden
      placement="bottom"
      height="calc(100vh - 200px)"
      loading={questionData.length === 0 && open}
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
      <List
        dataSource={questionData}
        renderItem={(item) => (
          <ZhihuItem isDetail item={item} handleVote={() => voteHandler(item.id, questionData, setQuestionData)} />
        )}
      />
    </Drawer>
  );
};

export default QuestionDetailDrawer;
