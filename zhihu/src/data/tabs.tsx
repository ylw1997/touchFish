/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 09:19:24
 * @LastEditTime: 2025-08-14 18:06:53
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\data\tabs.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */

export type tabKeyType = "hot" | "follow" | "recommend" | "hot_question";
export const defTab = [
  { key: "recommend", label: "推荐" },
  { key: "follow", label: "关注" },
  { key: "hot", label: "热榜" },
  {
    key: "hot_question",
    label: "人气",
  },
] as { key: tabKeyType; label: string }[];
