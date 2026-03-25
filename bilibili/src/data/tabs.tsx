/*
 * @Description: Bilibili tabs 配置
 */

export interface TabItem {
  key: string;
  label: string;
  childrenList?: TabItem[];
}

export const defTab: TabItem[] = [
  {
    key: "recommend",
    label: "推荐",
  },
  {
    key: "popular",
    label: "热门",
  },
  {
    key: "dynamic",
    label: "动态",
  },
  {
    key: "watchlater",
    label: "待看",
  },
  {
    key: "favorites",
    label: "收藏夹",
    // childrenList 将在获取收藏夹后动态填充
  },
];
