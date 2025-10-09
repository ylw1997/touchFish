/*
 * 基础新闻 Provider 抽象类
 * 统一: getData 逻辑 / tab 读取 / showNewsNumber / diff / 图标
 */
import {
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  ProviderResult,
  ThemeIcon,
} from 'vscode';
import * as vscode from 'vscode';
import { fetchNewsList } from '../news/fetch';
import { formatData, compareNews } from '../utils/util';
import { NewsCommandType } from '../type/type';
import { ReadState } from './readState';
import * as crypto from 'crypto';

export interface NewsProviderOptions {
  sourceKey: string;              // newsSources.ts 中的 key
  commandName: string;            // 打开的命令 (例如 v2ex.openUrl)
  tabConfigKey?: string;          // 在配置中读取的 tab key (如 v2exTab)
  defaultTab?: string;            // 默认 tab (context 中的默认值)
}

export abstract class BaseNewsProvider implements TreeDataProvider<TreeItem> {
  protected newsList: TreeItem[] = [];
  private emitter = new EventEmitter<TreeItem | void>();
  readonly onDidChangeTreeData = this.emitter.event;
  private loading = false;

  constructor(protected readonly opts: NewsProviderOptions) {}

  /** 强制刷新入口 (供命令调用) */
  async getData(tabOverride?: string) {
    if (this.loading) return; // 简单互斥，避免重复并发
    this.loading = true;
    try {
      const oldList = this.newsList;
      const config = vscode.workspace.getConfiguration('touchfish');
      const showNumber = (config.get('showNewsNumber') as number) ?? 10;
      let currentTab: string | undefined;
      if (this.opts.tabConfigKey) {
        currentTab = tabOverride || (config.get(this.opts.tabConfigKey) as string) || this.opts.defaultTab;
      }
      const params = currentTab ? { tab: currentTab } : undefined;
      const list = await fetchNewsList(this.opts.sourceKey, params);
      const plain = list.slice(0, showNumber).map(i => {
        const rawId = i.id || i.url || i.title;
        const id = crypto.createHash('md5').update(this.opts.sourceKey + '|' + rawId).digest('hex');
        return { title: i.title, url: i.url || '', id, read: ReadState.isRead(id), tooltip: i.url };
      });
      const items = formatData(plain as any, this.opts.commandName as NewsCommandType, 'notebook-render-output');
      this.newsList = compareNews(oldList, items, 'bell-dot', 'notebook-render-output');
    } catch (err: any) {
      const item = new TreeItem(`[加载失败] ${err?.message || '未知错误'}`);
      item.iconPath = new ThemeIcon('error');
      this.newsList = [item];
    } finally {
      this.loading = false;
      this.emitter.fire();
    }
  }

  getTreeItem(element: TreeItem): TreeItem { return element; }

  getChildren(): ProviderResult<TreeItem[]> {
    return this.newsList;
  }
}
