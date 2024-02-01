/*
 * @Author: YangLiwei
 * @Date: 2022-05-19 14:11:31
 * @LastEditTime: 2024-02-01 16:27:03
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\commands\refresh.ts
 * @Description: 
 */
import * as vscode from 'vscode';
import { ItHomeProvider } from '../Providers/itHomeProvider';
import { KKJProvider } from '../Providers/kkjProvider';
import { ClsProvider } from '../Providers/clsProvider';
import { ChipHellProvider } from '../Providers/chipHellProvider';
import { V2exProvider } from '../Providers/v2exProvider';
import { setConfigByKey } from '../config';
import { HupuProvider } from '../Providers/hupuProvider';

/**
 * 刷新之家树列表
 * @param newsProvider  数据提供者
 * @returns  指令
 */
export const refresh = (newsProvider:ItHomeProvider)=>{
  // 提供一个async 会触发vscode加载小横条
  return vscode.commands.registerCommand("itHome.refresh",async ()=>{
    await newsProvider.getData();
    // vscode.window.showInformationMessage("新闻已刷新!");
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
    // vscode.window.showInformationMessage("新闻已刷新!");
  });
};

/**
 *  刷新财联社树列表
 * @param clsProvider  数据提供者
 * @returns  指令
 */
export const clsRefresh = (clsProvider:ClsProvider)=>{
  return vscode.commands.registerCommand("cls.refresh",async ()=>{
    await clsProvider.getData();
    // vscode.window.showInformationMessage("新闻已刷新!");
  });
};

// 刷新chiphell文章列表
export const refreshChipHellNews = (chiphellNewsProvider:ChipHellProvider)=>{
  return vscode.commands.registerCommand("chiphell.refresh",async ()=>{
    await chiphellNewsProvider.getData();
    // vscode.window.showInformationMessage("新闻已刷新!");
  });
};

// 刷新v2ex文章列表
export const refreshV2exNews = (v2exProvider:V2exProvider)=>{
  return vscode.commands.registerCommand("v2ex.refresh",async ()=>{
    await v2exProvider.getData();
    // vscode.window.showInformationMessage("新闻已刷新!");
  });
};

// 刷新hupu文章列表
export const refreshHupuNews = (v2exProvider:HupuProvider)=>{
  return vscode.commands.registerCommand("hupu.refresh",async ()=>{
    await v2exProvider.getData();
    // vscode.window.showInformationMessage("新闻已刷新!");
  });
};


// 更改v2ex tab 
export const changeV2exTab =  (v2exProvider:V2exProvider)=>{
  return vscode.commands.registerCommand("v2ex.changeTab",async ()=>{
    const tab = await vscode.window.showQuickPick([
      {label:"全部",description:"all"},
      {label:"技术",description:"tech"},
      {label:"创意",description:"creative"},
      {label:"好玩",description:"play"},
      {label:"Apple",description:"apple"},
      {label:"酷工作",description:"jobs"},
      {label:"交易",description:"deals"},
      {label:"城市",description:"city"},
      {label:"问与答",description:"qna"},
      {label:"最热",description:"hot"},
      {label:"R2",description:"r2"}
    ]);
    if(tab){
      setConfigByKey("v2exTab",tab.description);
      vscode.commands.executeCommand('v2ex.refresh');
      vscode.window.showInformationMessage(`v2ex tab changed to ${tab.label}`);
    }
  });
};

// 更改v2ex tab 
export const changeHupuTab = (hupuProvider:HupuProvider)=>{
  return vscode.commands.registerCommand("hupu.changeTab",async ()=>{
    const tab = await vscode.window.showQuickPick([
      {label:"步行街热帖",description:"all-gambia"},
      {label:"步行街主干道",description:"topic-daily"},
      {label:"股票区",description:"stock"},
      {label:"历史区",description:"history"},
      {label:"健身区",description:"fit"},
      {label:"恋爱区",description:"love"},
      {label:"校园区",description:"school"},
      {label:"职场区",description:"workplace"},
    ]);
    if(tab){
      setConfigByKey("hupuTab",tab.description);
      vscode.commands.executeCommand('hupu.refresh');
      vscode.window.showInformationMessage(`v2ex tab changed to ${tab.label}`);
    }
  });
};