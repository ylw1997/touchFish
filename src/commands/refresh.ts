/*
 * @Author: YangLiwei
 * @Date: 2022-05-19 14:11:31
 * @LastEditTime: 2022-05-20 15:44:35
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\commands\refresh.ts
 * @Description: 
 */
import * as vscode from 'vscode';
import { ItHomeProvider } from '../Providers/itHomeProvider';
import { KKJProvider } from '../Providers/kkjProvider';

/**
 * 刷新之家树列表
 * @param newsProvider  数据提供者
 * @returns  指令
 */
export const refresh = (newsProvider:ItHomeProvider)=>{
  // 提供一个async 会触发vscode加载小横条
  return vscode.commands.registerCommand("itHome.refresh",async ()=>{
    await newsProvider.getData();
    vscode.window.showInformationMessage("新闻已刷新!");
  });
};

/**
 *  刷新快科技树列表
 * @param kkjProvider  数据提供者
 * @returns  指令
 */
export const kkjRefresh = (kkjProvider:KKJProvider)=>{
  return vscode.commands.registerCommand("kkj.refresh",async ()=>{
    await kkjProvider.getData();
    vscode.window.showInformationMessage("新闻已刷新!");
  });
};