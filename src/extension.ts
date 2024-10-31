/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 10:26:57
 * @LastEditTime: 2024-10-31 14:19:58
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\extension.ts
 * @Description: 
 */

import * as vscode from 'vscode';
import { openUrl, openCLSUrl, openCHUrl, openV2exUrl, openNgaUrl, openZhihuUrl } from './commands/openUrl';
import { refresh, clsRefresh, refreshChipHellNews, refreshV2exNews, refreshHupuNews, refreshNgaNews, refreshZhihuNews, refreshMixNews } from './commands/refresh';
import { ClsProvider } from './Providers/clsProvider';
import { ItHomeProvider } from './Providers/itHomeProvider';
import { refreshTime } from './config/index';
import { changeHupuTab, changeMixTab, changeNgaTab, changeV2exTab, openSetting } from './commands/commands';
import { ChipHellProvider } from './Providers/chipHellProvider';
import { V2exProvider } from './Providers/v2exProvider';
import { HupuProvider } from './Providers/hupuProvider';
import { defaultRefreshTime } from './data/context';
import { NgaProvider } from './Providers/ngaProvider';
import { ZhihuProvider } from './Providers/zhihuProvider';
import { MixProvider } from './Providers/mixProvider';

let timer: NodeJS.Timeout | null = null;

export function activate(context: vscode.ExtensionContext) {
	// 注册树列表提供者,需要在json文件中注册(activationEvents)
	const mixProvider = new MixProvider();
	const itHomeProvider = new ItHomeProvider();
	const clsProvider = new ClsProvider();
	const chiphellProvider = new ChipHellProvider();
	const v2exProvicer = new V2exProvider();
	const hupuProvider = new HupuProvider();
	const ngaProvider = new NgaProvider();
	const zhihuProvider = new ZhihuProvider();
	vscode.window.registerTreeDataProvider("view.ithomeList", itHomeProvider);
	vscode.window.registerTreeDataProvider("view.clsList", clsProvider);
	vscode.window.registerTreeDataProvider("view.chiphellList", chiphellProvider);
	vscode.window.registerTreeDataProvider("view.v2exList", v2exProvicer);
	vscode.window.registerTreeDataProvider("view.hupuList", hupuProvider);
	vscode.window.registerTreeDataProvider("view.ngaList", ngaProvider);
	vscode.window.registerTreeDataProvider("view.zhihuList", zhihuProvider);
	vscode.window.registerTreeDataProvider("mixView", mixProvider);

	// 注册刷新指令
	context.subscriptions.push(refresh(itHomeProvider));
	context.subscriptions.push(clsRefresh(clsProvider));
	context.subscriptions.push(refreshChipHellNews(chiphellProvider));
	context.subscriptions.push(refreshV2exNews(v2exProvicer));
	context.subscriptions.push(changeV2exTab(v2exProvicer));
	context.subscriptions.push(refreshHupuNews(hupuProvider));
	context.subscriptions.push(changeHupuTab(hupuProvider));
	context.subscriptions.push(refreshNgaNews(ngaProvider));
	context.subscriptions.push(changeNgaTab(ngaProvider));
	context.subscriptions.push(refreshZhihuNews(zhihuProvider));
	context.subscriptions.push(changeMixTab(mixProvider));
	context.subscriptions.push(refreshMixNews(mixProvider));
	//定时刷新新闻
	intervalRefrshNews();

	//注册打开新闻链接指令
	context.subscriptions.push(openUrl);
	context.subscriptions.push(openCLSUrl);
	context.subscriptions.push(openCHUrl);
	context.subscriptions.push(openSetting);
	context.subscriptions.push(openV2exUrl);
	context.subscriptions.push(openNgaUrl);
	context.subscriptions.push(openZhihuUrl);
}

// this method is called when your extension is deactivated
export function deactivate() {
	clearAllTimer();
}

// 清除所有定时器
const clearAllTimer = () => {
	if (timer) {
		clearInterval(timer);
	}
};

const refreshAll = () => {
	vscode.commands.executeCommand('cls.refresh');
	vscode.commands.executeCommand('itHome.refresh');
	vscode.commands.executeCommand('v2ex.refresh');
	vscode.commands.executeCommand('hupu.refresh');
	vscode.commands.executeCommand('chiphell.refresh');
	vscode.commands.executeCommand('nga.refresh');
	vscode.commands.executeCommand('zhihu.refresh');
};


// 定时刷新
const intervalRefrshNews = () => {
	if (timer) {
		clearInterval(timer);
	}
	refreshAll();
	const newconfig = vscode.workspace.getConfiguration('touchfish');
	const autoRefresh = newconfig.get('autoRefresh') as boolean;
	console.log("autoRefresh",autoRefresh);
	if(!autoRefresh){
		console.log("自动刷新已关闭!");
		return;
	}
	timer = setInterval(refreshAll, 1000 * (refreshTime||defaultRefreshTime));
};