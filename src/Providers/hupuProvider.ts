/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2024-02-01 13:58:32
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\hupuProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { compareNews, formatHupuData, formatV2exData } from '../utils/util';
import { showNewsNumber } from '../config/index';
import * as vscode from 'vscode';
import { getHupuList } from '../api/hupu';
import { defaultHupuTab } from '../data/context';

export class HupuProvider implements TreeDataProvider<TreeItem>{

  private update = new EventEmitter<TreeItem | void>(); // 用于触发刷新
	readonly onDidChangeTreeData = this.update.event;
  
  private newsList:TreeItem[] = [];

  constructor() {
		this.getData();
	}

  async getData(tab?:string){
    const newconfig = vscode.workspace.getConfiguration('touchfish');
    const v2exTab = tab || newconfig.get('hupuTab') as string || defaultHupuTab;
    await getHupuList(v2exTab).then(res=>{
      const news = formatHupuData(res).slice(0,showNewsNumber);
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