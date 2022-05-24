/*
 * @Author: YangLiwei
 * @Date: 2022-05-24 16:18:31
 * @LastEditTime: 2022-05-24 17:23:23
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\commands\commands.ts
 * @Description: 
 */
// 注册命令
import { commands } from 'vscode';

// 打开设置
export const openSetting = commands.registerCommand('touchfish.openConfigPage', () => {
  commands.executeCommand('workbench.action.openSettings', '@ext:ylw.touchfish');
});