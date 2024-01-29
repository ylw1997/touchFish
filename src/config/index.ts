/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 15:26:01
 * @LastEditTime: 2024-01-29 16:32:21
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\config\index.ts
 * @Description: 
 */

import * as vscode from 'vscode';
const config = vscode.workspace.getConfiguration('touchfish');

// 显示新闻数量 默认为10
export let showNewsNumber: number = config.get('showNewsNumber') || 10;

// 显示新闻字数 默认为25
export let showNewsWordNumber: number|undefined = config.get('showNewsWordNumber');

//多少秒刷新一次财联社 刷新时间默认为60秒
export let refreshTime: number = config.get('refreshTime') || 60;

export let refreshSlowTime: number = config.get('refreshSlowTime') || 300;

export let v2exTab: string = config.get('v2exTab') || "all";

// 获取配置
export const getConfigByKey = (key:string)=>{
  return config.get(key);
};

// 设置配置
export const setConfigByKey = (key:string,value:any)=>{
  return config.update(key,value,true);
};

// 刷新配置
export const refrshConfig = () => {
  const newconfig = vscode.workspace.getConfiguration('touchfish');
  showNewsNumber = newconfig.get('showNewsNumber') || 10;
  showNewsWordNumber = newconfig.get('showNewsWordNumber');
  refreshTime = newconfig.get('refreshTime') || 60;
  refreshSlowTime = newconfig.get('refreshSlowTime') || 300;
  v2exTab = newconfig.get('v2exTab') || "all";
  printConfig();
};

export const printConfig = () => {
  console.log(`showNewsNumber:${showNewsNumber}`);
  console.log(`showNewsWordNumber:${showNewsWordNumber}`);
  console.log(`refreshTime:${refreshTime}`);
  console.log(`refreshSlowTime:${refreshSlowTime}`);
  console.log(`v2exTab:${v2exTab}`);
};