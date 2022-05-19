/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2022-05-19 15:49:50
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\DataProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { getNewsList } from './api';
import { formatData } from './util';

export class DataProvider implements TreeDataProvider<TreeItem>{

  private update = new EventEmitter<TreeItem | void>(); // 用于触发刷新
	readonly onDidChangeTreeData = this.update.event;
  
  private newsList:TreeItem[] = [];

  constructor() {
    
		this.getData();
	}

  async getData(){
    this.newsList = [];
    await getNewsList().then(res=>{
       this.newsList = formatData(res.data.newslist);
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