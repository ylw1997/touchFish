/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2025-09-30 15:16:24
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\v2exProvider.ts
 * @Description:
 */
import {
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
} from "vscode";
// import { getV2exList } from '../api/v2ex';
import { fetchNewsList } from "../news/fetch";
import { compareNews, formatData } from "../utils/util";
import { showNewsNumber, v2exTab } from "../config/index";
import { defaultV2exTab } from "../data/context";

export class V2exProvider implements TreeDataProvider<TreeItem> {
  private update = new EventEmitter<TreeItem | void>(); // 用于触发刷新
  readonly onDidChangeTreeData = this.update.event;

  private newsList: TreeItem[] = [];

  constructor() {}

  async getData(tab?: string) {
    // 保留旧列表用于 diff，不能提前清空，否则 compareNews 无法标记新旧
    const oldList = this.newsList;
    const currentTab = tab || v2exTab || defaultV2exTab;
    // 新的统一注册表 + 缓存
    try {
      const data = await fetchNewsList("v2ex", { tab: currentTab });
      // 原逻辑需要的格式: formatData(NewsItem[], command)
      const limited = data.slice(0, showNewsNumber).map((item) => ({
        title: item.title,
        url: item.url || "",
      }));
      const news = formatData(limited, "v2ex.openUrl");
      this.newsList = compareNews(
        oldList,
        news,
        "bell-dot",
        "notebook-render-output"
      );
    } catch {
      // 回退逻辑（如果需要可重新启用旧实现）
    }
    this.update.fire();
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(): ProviderResult<TreeItem[]> {
    return this.newsList;
  }
}
