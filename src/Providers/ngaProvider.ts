/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:18:49
 * @LastEditTime: 2024-09-18 14:20:15
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\ngaProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { ngaTab, showNewsNumber } from '../config';
import { compareNews, formatData } from '../utils/util';
import { getNgaList } from '../api/nga';
import { defaultNgaTab } from '../data/context';

export class NgaProvider implements TreeDataProvider<TreeItem> {
  private newsList: TreeItem[] = [];
  private update = new EventEmitter<TreeItem | void>();
  readonly onDidChangeTreeData = this.update.event;

  constructor() {
  }

  async getData(tab?:string) {
    this.newsList = [];
    const nTab = tab || ngaTab || defaultNgaTab;
    await getNgaList(nTab).then(res => {
      const news = formatData(res,"nga.openUrl").slice(0, showNewsNumber);
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