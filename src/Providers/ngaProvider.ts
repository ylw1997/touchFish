/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:18:49
 * @LastEditTime: 2025-09-30 15:16:32
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\ngaProvider.ts
 * @Description:
 */
import { BaseNewsProvider } from '../core/baseNewsProvider';
import { defaultNgaTab } from '../data/context';

export class NgaProvider extends BaseNewsProvider {
  constructor() {
    super({
      sourceKey: 'nga',
      commandName: 'nga.openUrl',
      tabConfigKey: 'ngaTab',
      defaultTab: defaultNgaTab,
    });
  }
}
