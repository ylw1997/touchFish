/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 09:19:24
 * @LastEditTime: 2025-08-19 15:18:11
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\data\tabs.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */

import {
  FireOutlined,
  HeartOutlined,
  LikeOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

export type tabKeyType = "hot" | "follow" | "recommend" | "hot_question";
export const defTab = [
  {
    key: "recommend",
    label: (
      <>
        <LikeOutlined /> 推荐
      </>
    ),
  },
  {
    key: "follow",
    label: (
      <>
        <HeartOutlined /> 关注
      </>
    ),
  },
  {
    key: "hot",
    label: (
      <>
        <ThunderboltOutlined /> 热榜
      </>
    ),
  },
  {
    key: "hot_question",
    label: (
      <>
        <FireOutlined /> 热门
      </>
    ),
  },
];
