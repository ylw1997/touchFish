/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2025-09-30 15:16:38
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\itHomeProvider.ts
 * @Description:
 */
import {
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
} from "vscode";
import { compareNews, formatData } from "../utils/util";
// import { getNewsList } from '../api/ithome';
import { fetchNewsList } from "../news/fetch";
import { showNewsNumber } from "../config";

export class ItHomeProvider implements TreeDataProvider<TreeItem> {
  private update = new EventEmitter<TreeItem | void>(); // 用于触发刷新
  readonly onDidChangeTreeData = this.update.event;

  private newsList: TreeItem[] = [];

  constructor() {}

  async getData() {
    const oldList = this.newsList;
    const list = await fetchNewsList("ithome");
    const plain = list
      .slice(0, showNewsNumber)
      .map((i) => ({ title: i.title, url: i.url || "" }));
    const news = formatData(plain, "itHome.openUrl");
    this.newsList = compareNews(
      oldList,
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
