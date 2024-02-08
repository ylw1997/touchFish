/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:18:49
 * @LastEditTime: 2024-02-08 14:19:30
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @FilePath: \touchfish\src\Providers\ngaProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { showNewsNumber } from '../config';
import { compareNews, formatNgaData } from '../utils/util';
import { getNgaList } from '../api/nga';
import * as vscode from 'vscode';
import { defaultNgaTab } from '../data/context';

export class NgaProvider implements TreeDataProvider<TreeItem> {
  private newsList: TreeItem[] = [];
  private update = new EventEmitter<TreeItem | void>();
  readonly onDidChangeTreeData = this.update.event;

  constructor() {
    this.getData();
  }

  async getData(tab?:string) {
    const newconfig = vscode.workspace.getConfiguration('touchfish');
    const ngaTab = tab || newconfig.get('ngaTab') as string || defaultNgaTab;
    await getNgaList(ngaTab).then(res => {
      let news = formatNgaData(res).slice(0, showNewsNumber);
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