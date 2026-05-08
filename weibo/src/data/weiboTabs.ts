export type WeiboTab = {
  key: string;
  label: string;
  childrenList?: WeiboTab[];
};

export type WeiboGroupItem = {
  gid?: string;
  uid?: string;
  title?: string;
  containerid?: string;
  fid?: string;
};

export type WeiboGroupSection = {
  title?: string;
  group?: WeiboGroupItem[];
};

export type WeiboGroupsResponse = {
  groups?: WeiboGroupSection[];
};

const DEFAULT_FOCUS_LABELS = ["全部", "最新", "特别", "好友"] as const;

const focusPathBuilders = [
  (gid: string) =>
    `/unreadfriendstimeline?list_id=${gid}&refresh=4&since_id=0&count=15`,
  (gid: string) =>
    `/friendstimeline?list_id=${gid}&refresh=4&since_id=0&count=25`,
  (gid: string) =>
    `/groupstimeline?list_id=${gid}&refresh=4&since_id=0&count=25`,
  (gid: string) =>
    `/groupstimeline?list_id=${gid}&refresh=4&since_id=0&count=25`,
] as const;

export const defaultWeiboActiveKey = (tabs: WeiboTab[]) =>
  tabs.find((tab) => tab.label === "全部")?.key ?? firstRequestKey(tabs) ?? "";

export const buildWeiboTabsFromGroups = (
  response?: WeiboGroupsResponse
): WeiboTab[] => {
  const sections = response?.groups ?? [];
  const defaultGroups = findSection(sections, "默认分组").group ?? [];
  const mineGroups = findSection(sections, "我的分组").group ?? [];
  const channelGroups = findSection(sections, "我的频道").group ?? [];

  const focusTabs = DEFAULT_FOCUS_LABELS.map((label, index) => {
    const gid = defaultGroups[index]?.gid;
    if (!gid) return undefined;

    return {
      key: focusPathBuilders[index](gid),
      label,
    };
  }).filter(Boolean) as WeiboTab[];

  const hotChildren = channelGroups.map(buildHotTab).filter(Boolean) as WeiboTab[];
  const mineChildren = mineGroups.map(buildGroupTab).filter(Boolean) as WeiboTab[];
  const tabs: WeiboTab[] = [];

  if (hotChildren.length > 0) {
    tabs.push({
      key: "hot",
      label: "推荐",
      childrenList: hotChildren,
    });
  }

  tabs.push(...focusTabs);

  if (mineChildren.length > 0) {
    tabs.push({
      key: "mine",
      label: "我的",
      childrenList: mineChildren,
    });
  }

  return tabs;
};

export const getWeiboUidFromGroups = (response?: WeiboGroupsResponse) => {
  const defaultGroups = findSection(response?.groups ?? [], "默认分组").group ?? [];
  const allGroup = defaultGroups.find((group) => group.title === "全部关注");

  return allGroup?.uid ?? defaultGroups[0]?.uid ?? "";
};

const firstRequestKey = (tabs: WeiboTab[]) => {
  for (const tab of tabs) {
    if (tab.childrenList?.length) return tab.childrenList[0].key;
    if (tab.key) return tab.key;
  }
  return undefined;
};

const findSection = (sections: WeiboGroupSection[], title: string) =>
  sections.find((section) => section.title === title) ?? {};

const buildGroupTab = (group: WeiboGroupItem): WeiboTab | undefined => {
  if (!group.gid || !group.title) return undefined;
  return {
    key: `/groupstimeline?list_id=${group.gid}&refresh=4&since_id=0&count=25`,
    label: group.title,
  };
};

const buildHotTab = (group: WeiboGroupItem): WeiboTab | undefined => {
  const containerid = group.containerid ?? group.fid;
  if (!group.gid || !group.title || !containerid) return undefined;

  const prefix =
    group.gid === "102803"
      ? "/hottimeline?since_id=0&refresh=0&"
      : "/hottimeline?";

  return {
    key: `${prefix}group_id=${group.gid}&containerid=${containerid}&extparam=discover%7Cnew_feed&max_id=0&count=25`,
    label: group.title,
  };
};
