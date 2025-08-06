/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:18:49
 * @LastEditTime: 2025-08-06 09:58:11
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\zhihuProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { showNewsNumber } from '../config';
import { compareNews, formatData } from '../utils/util';
import { getZhihuList } from '../api/zhihu';
import * as vscode from 'vscode';

export class ZhihuProvider implements TreeDataProvider<TreeItem> {
  private newsList: TreeItem[] = [];
  private update = new EventEmitter<TreeItem | void>();
  readonly onDidChangeTreeData = this.update.event;
  private tab: "recommend" | "hot" = "recommend";

  constructor() {
  }

  async getData() {
    this.newsList = [];
    await getZhihuList(this.tab).then(res => {
      if(!res) return;
      const news = formatData(res,"zhihu.openUrl").slice(0, showNewsNumber);
      this.newsList = compareNews(this.newsList,news,"bell-dot","notebook-render-output");
    });
    this.update.fire();
  }

  changeTab() {
    this.tab = this.tab === "recommend" ? "hot" : "recommend";
    // 给用户提示
    vscode.window.showInformationMessage(`已切换至 ${this.tab === "recommend" ? "推荐" : "热榜" }`);
    this.getData();
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(): ProviderResult<TreeItem[]> {
    return this.newsList;
  }


}