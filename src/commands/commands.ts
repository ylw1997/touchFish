/*
 * @Author: YangLiwei
 * @Date: 2022-05-24 16:18:31
 * @LastEditTime: 2025-08-18 10:19:42
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\commands\commands.ts
 * @Description: 
 */
// 注册命令
import { commands } from 'vscode';
import { NgaProvider } from '../Providers/ngaProvider';
import { setConfigByKey } from '../config';
import * as vscode from 'vscode';
import { V2exProvider } from '../Providers/v2exProvider';
import { HupuProvider } from '../Providers/hupuProvider';

// 打开设置
export const openSetting = commands.registerCommand('touchfish.openConfigPage', () => {
  commands.executeCommand('workbench.action.openSettings', '@ext:ylw.touchfish');
});

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

// 设置知乎token
export const setZhihuTokenCommand = () => {
    return vscode.commands.registerCommand('touchfish.setZhihuToken', async () => {
        const zhihuCookie = await vscode.window.showInputBox({
            prompt: '请输入知乎的Cookie',
            placeHolder: '请输入知乎的Cookie',
        });
        if (zhihuCookie !== undefined) {
            await setConfigByKey("zhihuCookie",zhihuCookie);
            await vscode.window.showInformationMessage('知乎Cookie设置成功,点击刷新按钮查看!');
        }
    });
};

// 设置微博token
export const setWeiboTokenCommand = () => {
    return vscode.commands.registerCommand('touchfish.setWeiboToken', async () => {
        const weiboCookie = await vscode.window.showInputBox({
            prompt: '请输入微博的Cookie',
            placeHolder: '请输入微博的Cookie',
        });
        if (weiboCookie !== undefined) {
            await setConfigByKey("weiboCookie",weiboCookie);
            await vscode.window.showInformationMessage('微博Cookie设置成功,点击刷新按钮查看!');
        }
    });
};

// 设置NGA-token
export const setNgaTokenCommand = () => {
    return vscode.commands.registerCommand('touchfish.setNgaToken', async () => {
        const ngaCookie = await vscode.window.showInputBox({
            prompt: '请输入NGA的Cookie',
            placeHolder: '请输入NGA的Cookie',
        });
        if (ngaCookie !== undefined) {
            await setConfigByKey("ngaCookie",ngaCookie);
            await vscode.window.showInformationMessage('NGA-Cookie设置成功,点击刷新按钮查看!');
        }
    });
};