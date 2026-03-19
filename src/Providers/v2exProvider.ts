/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2025-09-30 15:16:24
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\v2exProvider.ts
 * @Description:
 */
import { BaseNewsProvider } from '../core/baseNewsProvider';
import { defaultV2exTab } from '../data/context';

export class V2exProvider extends BaseNewsProvider {
  constructor() {
    super({
      sourceKey: 'v2ex',
      commandName: 'v2ex.openUrl',
      tabConfigKey: 'v2exTab',
      defaultTab: defaultV2exTab,
    });
  }
}
