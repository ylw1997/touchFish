/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:21:22
 * @LastEditTime: 2025-09-30 15:16:38
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\itHomeProvider.ts
 * @Description:
 */
import { BaseNewsProvider } from '../core/baseNewsProvider';

export class ItHomeProvider extends BaseNewsProvider {
  constructor() {
    super({
      sourceKey: 'ithome',
      commandName: 'itHome.openUrl',
    });
  }
}
