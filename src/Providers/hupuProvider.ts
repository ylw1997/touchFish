/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2024-10-30 13:42:34
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\hupuProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { compareNews, formatData } from '../utils/util';
import { hupuTab, showNewsNumber } from '../config/index';
import { getHupuList } from '../api/hupu';
import { defaultHupuTab } from '../data/context';

export class HupuProvider implements TreeDataProvider<TreeItem>{

  private update = new EventEmitter<TreeItem | void>(); // 用于触发刷新
	readonly onDidChangeTreeData = this.update.event;
  
  private newsList:TreeItem[] = [];

  constructor() {
	}

  async getData(tab?:string){
    this.newsList = [];
    const v2exTab = tab || hupuTab || defaultHupuTab;
    await getHupuList(v2exTab).then(res=>{
      const news = formatData(res,"hupu.openUrl").slice(0,showNewsNumber);
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