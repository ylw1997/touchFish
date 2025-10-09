/**
 * 基础新闻 Provider 抽象类
 * 职责：统一获取数据 / 读取配置 tab / 控制显示数量 / 图标差异化 / 已读局部刷新
 * 精简原则：
 * 1. getData 只保留流程编排；细节拆到私有方法
 * 2. 已读更新不触发额外网络请求
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
  /** newsSources.ts 中的 key */
  sourceKey: string;
  /** 打开详情的命令，如 v2ex.openUrl */
  commandName: string;
  /** 配置里对应的 tab key，如 v2exTab */
  tabConfigKey?: string;
  /** 没配置时的默认 tab */
  defaultTab?: string;
}

export abstract class BaseNewsProvider implements TreeDataProvider<TreeItem> {
  protected newsList: TreeItem[] = [];
  private emitter = new EventEmitter<TreeItem | void>();
  readonly onDidChangeTreeData = this.emitter.event;
  private loading = false;

  // ================= 静态注册（局部已读刷新用） =================
  private static registry: Map<string, BaseNewsProvider> = new Map();
  /**
   * 根据 sourceKey 注册实例
   */
  private static registerInstance(sourceKey: string, instance: BaseNewsProvider) {
    this.registry.set(sourceKey, instance);
  }
  /**
   * 供命令端调用：通过唯一 id 标记已读（局部更新，不触发重新 fetch）
   * @param uniqueId md5 过的 id
   */
  static markReadGlobally(uniqueId: string) {
    // 遍历所有 provider，找到并更新对应的 TreeItem
    for (const provider of this.registry.values()) {
      const updated = provider.markItemRead(uniqueId, true);
      if (updated) {
        break; // 找到一个即可（id 全局唯一）
      }
    }
  }

  constructor(protected readonly opts: NewsProviderOptions) {
    BaseNewsProvider.registerInstance(opts.sourceKey, this);
  }

  /** 局部标记已读并可选择触发 UI 刷新 */
  protected markItemRead(uniqueId: string, fire = true): boolean {
    let changed = false;
    this.newsList = this.newsList.map(item => {
      if (item.id === uniqueId) {
        const iconId = (item.iconPath as ThemeIcon | undefined)?.id;
        if (iconId !== 'eye') {
          item.iconPath = new ThemeIcon('eye');
          changed = true;
        }
      }
      return item;
    });
    if (changed && fire) {
      this.emitter.fire();
    }
    return changed;
  }

  // ================== 数据获取主流程 ==================
  /** 强制刷新入口 */
  async getData(tabOverride?: string) {
    if (this.loading) return; // 简单互斥，避免重复并发
    this.loading = true;
    try {
      const old = this.newsList;
      const tab = this.resolveTab(tabOverride);
      const rawList = await fetchNewsList(this.opts.sourceKey, tab ? { tab } : undefined);
      const limited = this.limitList(rawList);
      const items = this.buildTreeItems(limited);
      this.newsList = compareNews(old, items, 'bell-dot', 'notebook-render-output');
    } catch (err: any) {
      const item = new TreeItem(`[加载失败] ${err?.message || '未知错误'}`);
      item.iconPath = new ThemeIcon('error');
      this.newsList = [item];
    } finally {
      this.loading = false;
      this.emitter.fire();
    }
  }

  // ================== 私有辅助方法 ==================
  /** 解析当前 tab */
  private resolveTab(override?: string): string | undefined {
    if (!this.opts.tabConfigKey) return undefined;
    if (override) return override;
    const cfg = vscode.workspace.getConfiguration('touchfish');
    return (cfg.get(this.opts.tabConfigKey) as string) || this.opts.defaultTab;
  }

  /** 限制数量 */
  private limitList(list: any[]): any[] {
    const cfg = vscode.workspace.getConfiguration('touchfish');
    const showNumber = (cfg.get('showNewsNumber') as number) ?? 10;
    return list.slice(0, showNumber);
  }

  /** 构建 TreeItem 列表 */
  private buildTreeItems(list: any[]): TreeItem[] {
    const plain = list.map(i => {
      const rawId = i.id || i.url || i.title;
      const id = this.generateItemId(rawId);
      return { title: i.title, url: i.url || '', id, read: ReadState.isRead(id), tooltip: i.url };
    });
    return formatData(plain as any, this.opts.commandName as NewsCommandType, 'notebook-render-output');
  }

  /** 生成稳定唯一 ID（来源 + 原始 id/url/title 的 md5） */
  private generateItemId(raw: string): string {
    return crypto.createHash('md5').update(this.opts.sourceKey + '|' + raw).digest('hex');
  }

  getTreeItem(element: TreeItem): TreeItem { return element; }

  getChildren(): ProviderResult<TreeItem[]> {
    return this.newsList;
  }
}
