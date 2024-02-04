/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2024-02-04 15:57:55
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\v2exProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { getV2exList } from '../api/v2ex';
import { compareNews, formatV2exData } from '../utils/util';
import { showNewsNumber } from '../config/index';
import * as vscode from 'vscode';
import { defaultV2exTab } from '../data/context';

export class V2exProvider implements TreeDataProvider<TreeItem>{

  private update = new EventEmitter<TreeItem | void>(); // 用于触发刷新
	readonly onDidChangeTreeData = this.update.event;
  
  private newsList:TreeItem[] = [];

  constructor() {
		this.getData();
	}

  async getData(tab?:string){
    const newconfig = vscode.workspace.getConfiguration('touchfish');
    const v2exTab = tab || newconfig.get('v2exTab') as string || defaultV2exTab;
    await getV2exList(v2exTab).then(res=>{
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