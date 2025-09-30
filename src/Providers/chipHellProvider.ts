/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:18:49
 * @LastEditTime: 2025-09-30 15:16:43
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\chipHellProvider.ts
 * @Description:
 */
import {
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
} from "vscode";
// import { getChipHellNews } from '../api/chipHell';
import { fetchNewsList } from "../news/fetch";
import { showNewsNumber } from "../config";
import { compareNews, formatData } from "../utils/util";

export class ChipHellProvider implements TreeDataProvider<TreeItem> {
  private newsList: TreeItem[] = [];
  private update = new EventEmitter<TreeItem | void>();
  readonly onDidChangeTreeData = this.update.event;

  constructor() {}

  async getData() {
    const oldList = this.newsList;
    const list = await fetchNewsList("chiphell");
    const plain = list
      .slice(0, showNewsNumber)
      .map((i) => ({ title: i.title, url: i.url || "" }));
    const news = formatData(plain, "chiphell.openUrl");
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
