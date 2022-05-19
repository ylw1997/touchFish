/*
 * @Author: YangLiwei
 * @Date: 2022-05-19 14:11:31
 * @LastEditTime: 2022-05-19 15:07:27
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\commands\refresh.ts
 * @Description: 
 */
import * as vscode from 'vscode';
import { DataProvider } from '../DataProvider';

/**
 * 刷新树列表
 * @param newsProvider  数据提供者
 * @returns  指令
 */
export const refresh = (newsProvider:DataProvider)=>{
  // 提供一个async 会触发vscode加载小横条
  return vscode.commands.registerCommand("itHome.refresh",async ()=>{
    await newsProvider.getData();
    vscode.window.showInformationMessage("新闻已刷新!");
  });
};