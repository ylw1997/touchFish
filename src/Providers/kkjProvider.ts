/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 15:21:18
 * @LastEditTime: 2022-05-23 11:11:20
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\Providers\kkjProvider.ts
 * @Description: 
 */
import * as vscode from 'vscode';
import { ProviderResult, TreeDataProvider } from 'vscode';
import { getKKJNewsList } from '../api/kjj';
import { formatKKJData } from '../utils/util';
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
      this.newsList = formatKKJData(res).slice(0,showNewsNumber);
    });
    this.update.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: vscode.TreeItem): ProviderResult<vscode.TreeItem[]> {
    return this.newsList;
  }
}