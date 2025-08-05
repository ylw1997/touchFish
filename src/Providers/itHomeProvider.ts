/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2024-09-18 14:15:27
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\itHomeProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { compareNews, formatData } from '../utils/util';
import { getNewsList } from '../api/ithome';
import { showNewsNumber } from '../config';
import { NewsItem } from '../type/type';

export class ItHomeProvider implements TreeDataProvider<TreeItem>{

  private update = new EventEmitter<TreeItem | void>(); // 用于触发刷新
	readonly onDidChangeTreeData = this.update.event;
  
  private newsList:TreeItem[] = [];

  constructor() {
	}

  async getData(){
    this.newsList = [];
    await getNewsList().then(res=>{
      const newsList = res.data.newslist.map((item:NewsItem)=>({...item,url:item.newsid}));
      const news = formatData(newsList,"itHome.openUrl").slice(0,showNewsNumber);
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