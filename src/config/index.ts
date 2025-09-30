/*
 * @Author: YangLiwei
 * @Date: 2022-05-20 15:26:01
 * @LastEditTime: 2025-08-05 16:24:43
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\config\index.ts
 * @Description: 
 */

import * as vscode from 'vscode';
const config = vscode.workspace.getConfiguration('touchfish');

// 显示新闻数量 默认为10
export let showNewsNumber: number|undefined = config.get('showNewsNumber');


//多少秒刷新一次财联社 刷新时间默认为60秒


export let v2exTab: string|undefined = config.get('v2exTab');
export let hupuTab: string|undefined = config.get('hupuTab');
export let ngaTab: string|undefined = config.get('ngaTab');

// 设置配置
export const setConfigByKey = async (key:string,value:string)=>{
  return await config.update(key,value,true);
};

// 刷新配置
export const refrshConfig = () => {
  const newconfig = vscode.workspace.getConfiguration('touchfish');
  showNewsNumber = newconfig.get('showNewsNumber');
  
  v2exTab = newconfig.get('v2exTab');
  hupuTab = newconfig.get('hupuTab');
  ngaTab = newconfig.get('ngaTab');
};
