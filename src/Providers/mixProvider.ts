/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2024-10-31 11:54:27
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\mixProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { compareNews, formatData } from '../utils/util';
import { getNewsList } from '../api/ithome';
import { mixTab, showNewsNumber } from '../config';
import { NewsItem } from '../type/type';
import { defaultMixTab } from '../data/context';

export class MixProvider implements TreeDataProvider<TreeItem>{

  private update = new EventEmitter<TreeItem | void>(); // 用于触发刷新
	readonly onDidChangeTreeData = this.update.event;
  
  private newsList:TreeItem[] = [];

  constructor() {
		this.getData();
	}

  async getData(tab?:string){
    this.newsList = [];
    const nTab = tab || mixTab || defaultMixTab;
    console.log(nTab, "tab");
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