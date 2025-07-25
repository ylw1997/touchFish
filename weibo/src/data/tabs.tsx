/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-06-19 09:40:05
 * @LastEditTime: 2025-07-25 14:06:55
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\weibo\src\data\tabs.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved.
 * @Description:
 */
export const defTab = [
  { key: "/unreadfriendstimeline?list_id=100017515513422&count=25", label: "全部" },
  { key: "/friendstimeline?list_id=110007515513422&count=25", label: "最新" },
  { key: "/groupstimeline?list_id=4563498095349254&count=25", label: "特别" },
  { key: "/groupstimeline?list_id=100097515513422&count=25", label: "好友" },
  {
    key: "hot",
    label: "推荐",
    childrenList: [
      {
        key: "/hottimeline?group_id=102803&containerid=102803&extparam=discover%7Cnew_feed",
        label: "热门",
      },
      {
        key: "/hottimeline?group_id=1028034188&containerid=102803_ctg1_4188_-_ctg1_4188&extparam=discover%7Cnew_feed",
        label: "社会",
      },
      {
        key: "/hottimeline?group_id=102803600169&containerid=102803_ctg1_600169_-_ctg1_600169&extparam=discover%7Cnew_feed",
        label: "榜单",
      },
      {
        key: "/hottimeline?group_id=1028035088&containerid=102803_ctg1_5088_-_ctg1_5088&extparam=discover%7Cnew_feed",
        label: "数码",
      },
      {
        key: "/hottimeline?group_id=1028032088&containerid=102803_ctg1_2088_-_ctg1_2088&extparam=discover%7Cnew_feed",
        label: "科技",
      },
      {
        key: "/hottimeline?group_id=1028034388&containerid=102803_ctg1_4388_-_ctg1_4388&extparam=discover%7Cnew_feed",
        label: "搞笑",
      },
      {
        key: "/hottimeline?group_id=1028031288&containerid=102803_ctg1_1288_-_ctg1_1288&extparam=discover%7Cnew_feed",
        label: "股市",
      },
      {
        label: "财经",
        key: "/hottimeline?group_id=1028036388&containerid=102803_ctg1_6388_-_ctg1_6388&extparam=discover%7Cnew_feed",
      },
      {
        key: "/hottimeline?group_id=1028035188&containerid=102803_ctg1_5188_-_ctg1_5188&extparam=discover%7Cnew_feed",
        label: "汽车",
      },
      {
        labe: "旅游",
        key: "/hottimeline?group_id=1028032588&containerid=102803_ctg1_2588_-_ctg1_2588&extparam=discover%7Cnew_feed",
      },
      {
        label: "电影",
        key: "/hottimeline?group_id=1028033288&containerid=102803_ctg1_3288_-_ctg1_3288&extparam=discover%7Cnew_feed",
      },
      {
        label: "情感",
        key: "/hottimeline?group_id=1028031988&containerid=102803_ctg1_1988_-_ctg1_1988&extparam=discover%7Cnew_feed",
      },
      {
        label: "摄影",
        key: "/hottimeline?group_id=1028034988&containerid=102803_ctg1_4988_-_ctg1_4988&extparam=discover%7Cnew_feed",
      },
      {
        label: "音乐",
        key: "/hottimeline?group_id=1028035288&containerid=102803_ctg1_5288_-_ctg1_5288&extparam=discover%7Cnew_feed",
      },
      {
        key: "/hottimeline?group_id=102803600165&containerid=102803_ctg1_600165_-_ctg1_600165&extparam=discover%7Cnew_feed",
        label: "颜值",
      },
    ],
  },
];
