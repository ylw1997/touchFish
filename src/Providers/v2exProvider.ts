/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2024-09-18 14:20:55
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\v2exProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { getV2exList } from '../api/v2ex';
import { compareNews, formatData } from '../utils/util';
import { showNewsNumber, v2exTab } from '../config/index';
import { defaultV2exTab } from '../data/context';

export class V2exProvider implements TreeDataProvider<TreeItem>{

  private update = new EventEmitter<TreeItem | void>(); // 用于触发刷新
	readonly onDidChangeTreeData = this.update.event;
  
  private newsList:TreeItem[] = [];

  constructor() {
		this.getData();
	}

  async getData(tab?:string){
    const vTab = tab || v2exTab || defaultV2exTab;
    await getV2exList(vTab).then(res=>{
      const news = formatData(res,"v2ex.openUrl").slice(0,showNewsNumber);
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