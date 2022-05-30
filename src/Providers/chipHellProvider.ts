/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:18:49
 * @LastEditTime: 2022-05-30 09:46:32
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\Providers\chipHellProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { getChipHellNews } from '../api/chipHell';
import { showNewsNumber } from '../config';
import { compareNews, formatChipHellData } from '../utils/util';

export class ChipHellProvider implements TreeDataProvider<TreeItem> {
  private newsList: TreeItem[] = [];
  private update = new EventEmitter<TreeItem | void>();
  readonly onDidChangeTreeData = this.update.event;

  constructor() {
    this.getData();
  }

  async getData() {
    // this.newsList = [];
    await getChipHellNews().then(res => {
      let news = formatChipHellData(res).slice(0, showNewsNumber);
      this.newsList = compareNews(this.newsList,news,"bell-dot","notebook-render-output");
    });
    this.update.fire();
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
    return this.newsList;
  }


}