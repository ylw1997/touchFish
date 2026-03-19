/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2025-10-09 10:23:08
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\hupuProvider.ts
 * @Description: 
 */
import { BaseNewsProvider } from '../core/baseNewsProvider';
import { defaultHupuTab } from '../data/context';

export class HupuProvider extends BaseNewsProvider {
  constructor() {
    super({
      sourceKey: 'hupu',
      commandName: 'hupu.openUrl',
      tabConfigKey: 'hupuTab',
      defaultTab: defaultHupuTab,
    });
  }
}