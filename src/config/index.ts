/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 15:26:01
 * @LastEditTime: 2022-05-24 11:05:07
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\config\index.ts
 * @Description: 
 */

import * as vscode from 'vscode';
const config = vscode.workspace.getConfiguration('touchfish');

// 显示新闻数量 默认为10
export const showNewsNumber:number = config.get('showNewsNumber')||10;

// 显示新闻字数 默认为25
export const showNewsWordNumber:number = config.get('showNewsWordNumber')||25;

//多少秒刷新一次 刷新时间默认为30秒
export const refreshTime:number = config.get('refreshTime')||30;

console.log(`showNewsNumber:${showNewsNumber}`);
console.log(`showNewsWordNumber:${showNewsWordNumber}`);
console.log(`refreshTime:${refreshTime}`);