/*
 * @Author: YangLiwei
 * @Date: 2022-05-26 15:18:49
 * @LastEditTime: 2025-09-30 15:16:43
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\chipHellProvider.ts
 * @Description:
 */
import { BaseNewsProvider } from '../core/baseNewsProvider';

export class ChipHellProvider extends BaseNewsProvider {
  constructor() {
    super({
      sourceKey: 'chiphell',
      commandName: 'chiphell.openUrl',
    });
  }
}
