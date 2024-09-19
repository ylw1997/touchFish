/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:18:49
 * @LastEditTime: 2024-09-18 17:22:18
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\ZhihuProvider.ts
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
    this.getData();
  }

  async getData() {
    await getZhihuList().then(res => {
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