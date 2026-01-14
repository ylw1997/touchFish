/*
 * @Description: 收藏夹 Tab 逻辑 Hook
 */
import { useState, useCallback, useMemo } from "react";
import { TabItem } from "../data/tabs";

// 收藏夹 tab 项类型
export interface FavoriteTabItem {
  key: string;
  label: string;
  id: number;
  media_count: number;
}

interface UseFavoriteTabsOptions {
  tabs: TabItem[];
  getFavoriteFolders: () => Promise<FavoriteTabItem[]>;
  getFavoriteDetail: (mediaId: number, replace?: boolean) => Promise<void>;
  getListData: (
    key: string,
    replace?: boolean,
    forceRefresh?: boolean
  ) => Promise<void>;
  clearList: () => void;
}

export const useFavoriteTabs = ({
  tabs,
  getFavoriteFolders,
  getFavoriteDetail,
  getListData,
  clearList,
}: UseFavoriteTabsOptions) => {
  const [activeKey, setActiveKey] = useState(tabs[0]?.key || "");
  const [subActiveKey, setSubActiveKey] = useState("");
  const [favoriteTabs, setFavoriteTabs] = useState<FavoriteTabItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);

  // 获取当前 tab
  const curTab = useMemo(() => {
    return tabs.find((item) => item.key === activeKey);
  }, [activeKey, tabs]);

  // 收藏夹二级 Tab 的 items
  const favoriteTabItems = useMemo(() => {
    return favoriteTabs.map((item) => ({
      key: item.key,
      label: item.label,
    }));
  }, [favoriteTabs]);

  // 判断是否有二级 Tab
  const hasSubTabs = useMemo(() => {
    if (activeKey === "favorites") {
      return favoriteTabs.length > 0;
    }
    return curTab && curTab.childrenList && curTab.childrenList.length > 0;
  }, [activeKey, favoriteTabs, curTab]);

  // 获取当前二级 Tab items
  const subTabItems = useMemo(() => {
    if (activeKey === "favorites") {
      return favoriteTabItems;
    }
    return curTab?.childrenList;
  }, [activeKey, favoriteTabItems, curTab]);

  // 请求数据
  const fetchData = useCallback(() => {
    if (activeKey === "favorites" && currentFolderId) {
      getFavoriteDetail(currentFolderId, false);
    } else {
      const currentKey = subActiveKey || activeKey;
      getListData(currentKey);
    }
  }, [
    subActiveKey,
    activeKey,
    getListData,
    currentFolderId,
    getFavoriteDetail,
  ]);

  // 刷新数据
  const refreshData = useCallback(() => {
    clearList();
    if (activeKey === "favorites" && currentFolderId) {
      getFavoriteDetail(currentFolderId, true);
    } else {
      const key = subActiveKey || activeKey;
      // 刷新时传入 forceRefresh=true，强制清空缓存并重新请求
      getListData(key, true, true);
    }
  }, [
    activeKey,
    currentFolderId,
    subActiveKey,
    clearList,
    getFavoriteDetail,
    getListData,
  ]);

  // 子菜单切换
  const onSubChange = useCallback(
    (key: string) => {
      setSubActiveKey(key);
      clearList();

      if (activeKey === "favorites") {
        const folder = favoriteTabs.find((item) => item.key === key);
        if (folder) {
          setCurrentFolderId(folder.id);
          getFavoriteDetail(folder.id, true);
        }
      } else {
        getListData(key, true);
      }
    },
    [clearList, getListData, activeKey, favoriteTabs, getFavoriteDetail]
  );

  // tab 切换
  const onChange = useCallback(
    async (key: string) => {
      clearList();
      setActiveKey(key);

      if (key === "favorites") {
        const folders = await getFavoriteFolders();
        if (folders.length > 0) {
          setFavoriteTabs(folders);
          setSubActiveKey(folders[0].key);
          setCurrentFolderId(folders[0].id);
          getFavoriteDetail(folders[0].id, true);
        } else {
          setFavoriteTabs([]);
          setSubActiveKey("");
          setCurrentFolderId(null);
        }
      } else {
        setFavoriteTabs([]);
        setCurrentFolderId(null);
        const curTab = tabs.find((item) => item.key === key);
        if (curTab && curTab.childrenList && curTab.childrenList.length > 0) {
          setSubActiveKey(curTab.childrenList?.[0]!.key || "");
          getListData(curTab.childrenList?.[0]!.key || "", true);
        } else {
          setSubActiveKey("");
          getListData(key, true);
        }
      }
    },
    [clearList, getListData, tabs, getFavoriteFolders, getFavoriteDetail]
  );

  return {
    activeKey,
    subActiveKey,
    curTab,
    hasSubTabs,
    subTabItems,
    currentFolderId,
    fetchData,
    refreshData,
    onSubChange,
    onChange,
  };
};
