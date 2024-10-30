/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 15:21:18
 * @LastEditTime: 2024-09-18 14:18:55
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\kkjProvider.ts
 * @Description: 
 */
import * as vscode from 'vscode';
import { ProviderResult, TreeDataProvider } from 'vscode';
import { getKKJNewsList } from '../api/kjj';
import { compareNews, formatData } from '../utils/util';
import { showNewsNumber } from '../config/index';

export class KKJProvider implements TreeDataProvider<vscode.TreeItem> {
  private newsList: vscode.TreeItem[] = [];
  private update = new vscode.EventEmitter<vscode.TreeItem | void>();
  readonly onDidChangeTreeData = this.update.event;

  constructor() {
    this.getData();
  }

  async getData() {
    this.newsList = [];
    await getKKJNewsList().then(res => {
      const news = formatData(res,"kkj.openUrl").slice(0,showNewsNumber);
      this.newsList = compareNews(this.newsList,news,"bell-dot","notebook-render-output");
    });
    this.update.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(): ProviderResult<vscode.TreeItem[]> {
    return this.newsList;
  }
}