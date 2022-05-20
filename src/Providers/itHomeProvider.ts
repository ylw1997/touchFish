/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2022-05-20 11:29:00
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\Providers\itHomeProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { formatData } from '../utils/util';
import { getNewsList } from '../api/ithome';

export class ItHomeProvider implements TreeDataProvider<TreeItem>{

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