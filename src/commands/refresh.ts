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
import { ClsProvider } from '../Providers/clsProvider';
import { ChipHellProvider } from '../Providers/chipHellProvider';
import { V2exProvider } from '../Providers/v2exProvider';
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


// 刷新hupu文章列表
export const refreshNgaNews = (ngaProvider:NgaProvider)=>{
  return vscode.commands.registerCommand("nga.refresh",async ()=>{
    await ngaProvider.getData(vscode.workspace.getConfiguration('touchfish').get('ngaTab'));
  });
};


