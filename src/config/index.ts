/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 15:26:01
 * @LastEditTime: 2024-10-31 11:52:38
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\config\index.ts
 * @Description: 
 */

import * as vscode from 'vscode';
const config = vscode.workspace.getConfiguration('touchfish');

// 显示新闻数量 默认为10
export let showNewsNumber: number|undefined = config.get('showNewsNumber');

// 显示新闻字数 默认为25
export let showNewsWordNumber: number|undefined = config.get('showNewsWordNumber');

//多少秒刷新一次财联社 刷新时间默认为60秒
export let refreshTime: number|undefined = config.get('refreshTime');

export let v2exTab: string|undefined = config.get('v2exTab');
export let hupuTab: string|undefined = config.get('hupuTab');
export let ngaTab: string|undefined = config.get('ngaTab');
export let mixTab: string|undefined = config.get('mixTab');

// 设置配置
export const setConfigByKey = async (key:string,value:string)=>{
  return await config.update(key,value,true);
};

// 刷新配置
export const refrshConfig = () => {
  const newconfig = vscode.workspace.getConfiguration('touchfish');
  showNewsNumber = newconfig.get('showNewsNumber');
  showNewsWordNumber = newconfig.get('showNewsWordNumber');
  refreshTime = newconfig.get('refreshTime');
  v2exTab = newconfig.get('v2exTab');
  hupuTab = newconfig.get('hupuTab');
  ngaTab = newconfig.get('ngaTab');
  mixTab = newconfig.get('mixTab');
};
