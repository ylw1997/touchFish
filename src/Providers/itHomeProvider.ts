/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2022-05-30 09:46:42
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\Providers\itHomeProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { compareNews, formatData } from '../utils/util';
import { getNewsList } from '../api/ithome';
import { showNewsNumber } from '../config';

export class ItHomeProvider implements TreeDataProvider<TreeItem>{

  private update = new EventEmitter<TreeItem | void>(); // 用于触发刷新
	readonly onDidChangeTreeData = this.update.event;
  
  private newsList:TreeItem[] = [];

  constructor() {
    
		this.getData();
	}

  async getData(){
    // this.newsList = [];
    await getNewsList().then(res=>{
      let news = formatData(res.data.newslist).slice(0,showNewsNumber);
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