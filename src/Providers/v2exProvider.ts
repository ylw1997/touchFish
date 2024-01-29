/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2024-01-29 14:05:31
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\v2exProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { getV2exList } from '../api/v2ex';
import { compareNews, formatV2exData } from '../utils/util';
import { showNewsNumber } from '../config/index';

export class V2exProvider implements TreeDataProvider<TreeItem>{

  private update = new EventEmitter<TreeItem | void>(); // 用于触发刷新
	readonly onDidChangeTreeData = this.update.event;
  
  private newsList:TreeItem[] = [];

  constructor() {
    
		this.getData();
	}

  async getData(){
    // this.newsList = [];
    console.log("v2ex");
    await getV2exList().then(res=>{
      const news = formatV2exData(res).slice(0,showNewsNumber);
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