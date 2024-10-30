/*
 * @Author: YangLiwei
 * @Date: 2022-05-19 14:11:31
 * @LastEditTime: 2024-10-30 13:40:55
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
import { NgaProvider } from '../Providers/ngaProvider';
import { ZhihuProvider } from '../Providers/zhihuProvider';

/**
 * 刷新之家树列表
 * @param newsProvider  数据提供者
 * @returns  指令
 */
export const refresh = (newsProvider:ItHomeProvider)=>{
  // 提供一个async 会触发vscode加载小横条
  return vscode.commands.registerCommand("itHome.refresh",async ()=>{
    await newsProvider.getData();
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
  });
};

// 刷新chiphell文章列表
export const refreshChipHellNews = (chiphellNewsProvider:ChipHellProvider)=>{
  return vscode.commands.registerCommand("chiphell.refresh",async ()=>{
    await chiphellNewsProvider.getData();
  });
};

// 刷新v2ex文章列表
export const refreshV2exNews = (provider:V2exProvider)=>{
  return vscode.commands.registerCommand("v2ex.refresh",async ()=>{
    await provider.getData(vscode.workspace.getConfiguration('touchfish').get('v2exTab'));
  });
};

// 刷新hupu文章列表
export const refreshHupuNews = (provider:HupuProvider)=>{
  return vscode.commands.registerCommand("hupu.refresh",async ()=>{
    await provider.getData(vscode.workspace.getConfiguration('touchfish').get('hupuTab'));
  });
};


// 刷新知乎文章列表
export const refreshZhihuNews = (provider:ZhihuProvider)=>{
  return vscode.commands.registerCommand("zhihu.refresh",async ()=>{
    await provider.getData();
  });
};


// 更改v2ex tab 
export const changeV2exTab =  (provider:V2exProvider)=>{
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
      await provider.getData(tab.description);
      await setConfigByKey("v2exTab",tab.description);
      // await vscode.commands.executeCommand('v2ex.refresh');
      await vscode.window.showInformationMessage(`v2ex 切换为 ${tab.label}`);
    }
  });
};

// 更改v2ex tab 
export const changeHupuTab = (provider:HupuProvider)=>{
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
      await provider.getData(tab.description);
      await setConfigByKey("hupuTab",tab.description);
      // await vscode.commands.executeCommand('hupu.refresh');
      await vscode.window.showInformationMessage(`Hupu 切换为 ${tab.label}`);
    }
  });
};

// 刷新hupu文章列表
export const refreshNgaNews = (ngaProvider:NgaProvider)=>{
  return vscode.commands.registerCommand("nga.refresh",async ()=>{
    await ngaProvider.getData(vscode.workspace.getConfiguration('touchfish').get('ngaTab'));
  });
};


// 更改ngatab 
export const changeNgaTab = (ngaProvider:NgaProvider)=>{
  return vscode.commands.registerCommand("nga.changeTab",async ()=>{
    const tab = await vscode.window.showQuickPick([
      {label:"网事杂谈",description:"-7"},
      {label:"晴风村",description:"-7955747"},
      {label:"寂寞的车",description:"-343809"},
      {label:"生命之杯",description:"-81981"},
      {label:"漩涡书院",description:"524"},
      {label:"国际新闻",description:"843"},
      {label:"股票大时代",description:"706"},
      {label:"音乐影视",description:"-576177"},
      {label:"娱乐吃瓜",description:"-39223361"},
      {label:"消费电子",description:"436"},
      {label:"Cosplay",description:"472"},
      {label:"程序员职业交流",description:"-202020"},
    ]);
    if(tab){
      await ngaProvider.getData(tab.description);
      await setConfigByKey("ngaTab",tab.description);
      await vscode.window.showInformationMessage(`nga 切换为 ${tab.label}`);
    }
  });
};
