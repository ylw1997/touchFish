/*
 * @Description: Linux.do Provider
 */
import { BaseNewsProvider } from '../core/baseNewsProvider';

export class LinuxDoProvider extends BaseNewsProvider {
  constructor() {
    super({
      sourceKey: 'linuxdo',
      commandName: 'linuxdo.openUrl',
      tabConfigKey: '', // RSS 源不需要 tab
      defaultTab: '',
    });
  }
}
