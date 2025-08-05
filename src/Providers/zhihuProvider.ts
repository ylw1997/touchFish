/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:18:49
 * @LastEditTime: 2024-10-30 11:54:38
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\zhihuProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { showNewsNumber } from '../config';
import { compareNews, formatData } from '../utils/util';
import { getZhihuList } from '../api/zhihu';

export class ZhihuProvider implements TreeDataProvider<TreeItem> {
  private newsList: TreeItem[] = [];
  private update = new EventEmitter<TreeItem | void>();
  readonly onDidChangeTreeData = this.update.event;

  constructor() {
  }

  async getData() {
    this.newsList = [];
    await getZhihuList().then(res => {
      if(!res) return;
      const news = formatData(res,"zhihu.openUrl").slice(0, showNewsNumber);
      this.newsList = compareNews(this.newsList,news,"bell-dot","notebook-render-output");
    });
    this.update.fire();
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(): ProviderResult<TreeItem[]> {
    return this.newsList;
  }


}