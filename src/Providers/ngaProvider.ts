/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:18:49
 * @LastEditTime: 2025-09-30 15:16:32
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\ngaProvider.ts
 * @Description:
 */
import {
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
} from "vscode";
import { showNewsNumber, ngaTab } from "../config";
import { defaultNgaTab } from "../data/context";
import { compareNews, formatData } from "../utils/util";
// import { getNgaList } from '../api/nga';
import { fetchNewsList } from "../news/fetch";

export class NgaProvider implements TreeDataProvider<TreeItem> {
  private newsList: TreeItem[] = [];
  private update = new EventEmitter<TreeItem | void>();
  readonly onDidChangeTreeData = this.update.event;

  constructor() {}

  async getData(tab?: string) {
    this.newsList = [];
    const currentTab = tab || ngaTab || defaultNgaTab;
    const list = await fetchNewsList("nga", { tab: currentTab });
    const plain = list
      .slice(0, showNewsNumber)
      .map((i) => ({ title: i.title, url: i.url || "" }));
    const news = formatData(plain, "nga.openUrl");
    this.newsList = compareNews(
      this.newsList,
      news,
      "bell-dot",
      "notebook-render-output"
    );
    this.update.fire();
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(): ProviderResult<TreeItem[]> {
    return this.newsList;
  }
}
