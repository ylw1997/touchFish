/*
 * @Description: 收藏夹 Tab 逻辑 Hook
 */
import { useState, useCallback, useMemo, useEffect } from "react";
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
  liveTabsData?: any[];
}

export const useFavoriteTabs = ({
  tabs,
  getFavoriteFolders,
  getFavoriteDetail,
  getListData,
  clearList,
  liveTabsData = [],
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
    if (activeKey === "live") {
      return liveTabsData.length > 0;
    }
    return curTab && curTab.childrenList && curTab.childrenList.length > 0;
  }, [activeKey, favoriteTabs, curTab, liveTabsData]);

  // 获取当前二级 Tab items
  const subTabItems = useMemo(() => {
    if (activeKey === "favorites") {
      return favoriteTabItems;
    }
    if (activeKey === "live") {
      return liveTabsData.map((item) => ({
        key: `live_${item.module_info.id}`,
        label: item.module_info.title,
      }));
    }
    return curTab?.childrenList;
  }, [activeKey, favoriteTabItems, curTab, liveTabsData]);

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
      } else if (activeKey === "live") {
        getListData(key, true);
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
      } else if (key === "live") {
        setFavoriteTabs([]);
        setCurrentFolderId(null);
        // live 本身加载时会请求 live index，如果在 useBilibiliAction 里能够自动设置初始 tab 就行
        setSubActiveKey(""); 
        getListData(key, true);
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

  // 当 liveTabsData 加载后，如果是 live tab，且当前 subActiveKey 为空，自动选中第一个
  useEffect(() => {
    if (activeKey === "live" && liveTabsData.length > 0 && !subActiveKey) {
      setSubActiveKey(`live_${liveTabsData[0].module_info.id}`);
    }
  }, [activeKey, liveTabsData, subActiveKey]);

  return {
    activeKey,
    subActiveKey,
    curTab,
    hasSubTabs,
    subTabItems,
    currentFolderId,
    setSubActiveKey, // 把这个抛出，以便需要时可修改
    fetchData,
    refreshData,
    onSubChange,
    onChange,
  };
};
