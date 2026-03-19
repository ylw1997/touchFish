/**
 * QQ音乐标签页配置
 */

export interface TabItem {
  key: string;
  label: string;
  icon?: string;
}

export const defTab: TabItem[] = [
  {
    key: "recommend",
    label: "推荐",
    icon: "HomeOutlined",
  },
  {
    key: "rank",
    label: "排行榜",
    icon: "TrophyOutlined",
  },
  {
    key: "my",
    label: "我的",
    icon: "UserOutlined",
  },
];

export const mySubTabs: TabItem[] = [
  {
    key: "favorite",
    label: "我喜欢",
  },
  {
    key: "playlists",
    label: "歌单",
  },
];
