/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 15:26:01
 * @LastEditTime: 2022-05-25 14:02:22
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\config\index.ts
 * @Description: 
 */

import * as vscode from 'vscode';
const config = vscode.workspace.getConfiguration('touchfish');

// 显示新闻数量 默认为10
export let showNewsNumber: number = config.get('showNewsNumber') || 10;

// 显示新闻字数 默认为25
export let showNewsWordNumber: number|undefined = config.get('showNewsWordNumber');

//多少秒刷新一次 刷新时间默认为30秒
export let refreshTime: number = config.get('refreshTime') || 30;

// 刷新配置
export const refrshConfig = () => {
  const newconfig = vscode.workspace.getConfiguration('touchfish');
  showNewsNumber = newconfig.get('showNewsNumber') || 10;
  showNewsWordNumber = newconfig.get('showNewsWordNumber');
  refreshTime = newconfig.get('refreshTime') || 30;
  printConfig();
};

export const printConfig = () => {
  console.log(`showNewsNumber:${showNewsNumber}`);
  console.log(`showNewsWordNumber:${showNewsWordNumber}`);
  console.log(`refreshTime:${refreshTime}`);
};