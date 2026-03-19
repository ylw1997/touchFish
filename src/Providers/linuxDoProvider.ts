/*
 * @Description: Linux.do Provider
 */
import { BaseNewsProvider } from '../core/baseNewsProvider';
import { defaultLinuxDoTab } from '../data/context';

export class LinuxDoProvider extends BaseNewsProvider {
  constructor() {
    super({
      sourceKey: 'linuxdo',
      commandName: 'linuxdo.openUrl',
      tabConfigKey: 'linuxDoTab',
      defaultTab: defaultLinuxDoTab,
    });
  }
}
