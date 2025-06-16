/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2025-06-16 14:19:11
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\mixProvider.ts
 * @Description: 
 */
import { EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from 'vscode';
import { compareNews, formatData } from '../utils/util';
import { getNewsList } from '../api/ithome';
import { hupuTab, mixTab, ngaTab, showNewsNumber, v2exTab } from '../config';
import { NewsItem } from '../type/type';
import { defaultHupuTab, defaultMixTab, defaultNgaTab, defaultV2exTab } from '../data/context';
import { getNgaList } from '../api/nga';
import * as vscode from 'vscode';
import { getHupuList } from '../api/hupu';
import { getV2exList } from '../api/v2ex';
import { getCLSNewsList } from '../api/cls';
import { getChipHellNews } from '../api/chipHell';

export class MixProvider implements TreeDataProvider<TreeItem> {

  private update = new EventEmitter<TreeItem | void>(); // 用于触发刷新
  readonly onDidChangeTreeData = this.update.event;

  private newsList: TreeItem[] = [];

  constructor() {
    this.getData();
  }
  async fetchAndProcessData(tabSource: string) {
    try {
      let formattedNews: TreeItem[] = [];
      switch (tabSource) {
        case "ithome":
          {
            const resIthome = await getNewsList();
            formattedNews = formatData(resIthome.data.newslist.map((item: NewsItem) => ({ ...item, url: item.newsid })), "itHome.openUrl").slice(0, showNewsNumber);
            break;
          }
        case "nga":
          {
            const ngaTabValue = (vscode.workspace.getConfiguration('touchfish').get('ngaTab') || ngaTab || defaultNgaTab) as string;
            const resNga = await getNgaList(ngaTabValue);
            formattedNews = formatData(resNga, "nga.openUrl").slice(0, showNewsNumber);
            break;
          }
        case "hupu":
          {
            const hupuTabValue = (vscode.workspace.getConfiguration('touchfish').get('hupuTab') || hupuTab || defaultHupuTab) as string;
            const resHupu = await getHupuList(hupuTabValue);
            formattedNews = formatData(resHupu, "hupu.openUrl").slice(0, showNewsNumber);
            break;
          }
        case "v2ex":
          {
            const v2exTabValue = (vscode.workspace.getConfiguration('touchfish').get('v2exTab') || v2exTab || defaultV2exTab) as string;
            const resV2ex = await getV2exList(v2exTabValue);
            formattedNews = formatData(resV2ex, "v2ex.openUrl").slice(0, showNewsNumber);
            break;
          }
        case "cls":
          {
            const resCls = await getCLSNewsList();
            formattedNews = formatData(resCls, "cls.openUrl", "server-environment").slice(0, showNewsNumber);
            break;
          }
        case "chiphell":
          {
            const resChipHell = await getChipHellNews();
            formattedNews = formatData(resChipHell, "chiphell.openUrl").slice(0, showNewsNumber);
            break;
          }
      }
      return compareNews([], formattedNews, "bell-dot", "notebook-render-output");
    } catch (error) {
      console.error(`${tabSource} 数据请求失败:`, error);
      return [];
    }
  }

  async getData(tab?: string) {
    this.newsList = [];
    const temptab = tab || mixTab || defaultMixTab;
    this.newsList = await this.fetchAndProcessData(temptab);
    this.update.fire();
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(): ProviderResult<TreeItem[]> {
    return this.newsList;
  }

}