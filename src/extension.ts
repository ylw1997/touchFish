/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 10:26:57
 * @LastEditTime: 2024-01-29 14:50:14
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\extension.ts
 * @Description: 
 */

import * as vscode from 'vscode';
import { openUrl, openKKJUrl, openCLSUrl, openCHUrl, openV2exUrl } from './commands/openUrl';
import { refresh, kkjRefresh, clsRefresh, refreshChipHellNews, refreshV2exNews } from './commands/refresh';
import { ClsProvider } from './Providers/clsProvider';
import { ItHomeProvider } from './Providers/itHomeProvider';
import { KKJProvider } from './Providers/kkjProvider';
import { printConfig, refreshSlowTime, refreshTime, refrshConfig } from './config/index';
import { openSetting } from './commands/commands';
import { ChipHellProvider } from './Providers/chipHellProvider';
import { V2exProvider } from './Providers/v2exProvider';

let timer: NodeJS.Timeout | null = null;
let slowTimer: NodeJS.Timeout | null = null;

export function activate(context: vscode.ExtensionContext) {
	// 注册树列表提供者,需要在json文件中注册(activationEvents)
	const newsProvider = new ItHomeProvider();
	const kkjProvider = new KKJProvider();
	const clsProvider = new ClsProvider();
	const chiphellProvider = new ChipHellProvider();
	const v2exProvicer = new V2exProvider();
	vscode.window.registerTreeDataProvider("view.newsList", newsProvider);
	vscode.window.registerTreeDataProvider("view.kkjList", kkjProvider);
	vscode.window.registerTreeDataProvider("view.clsList", clsProvider);
	vscode.window.registerTreeDataProvider("view.chiphellList", chiphellProvider);
	vscode.window.registerTreeDataProvider("view.v2exList", v2exProvicer);

	// 注册刷新指令
	context.subscriptions.push(refresh(newsProvider));
	context.subscriptions.push(kkjRefresh(kkjProvider));
	context.subscriptions.push(clsRefresh(clsProvider));
	context.subscriptions.push(refreshChipHellNews(chiphellProvider));
	context.subscriptions.push(refreshV2exNews(v2exProvicer));

	//定时刷新新闻
	printConfig();
	intervalRefrshNews();

	vscode.workspace.onDidChangeConfiguration(() => {
		console.log('配置发生变化!');
		refrshConfig();
		intervalRefrshNews();
	});

	//注册打开新闻链接指令
	context.subscriptions.push(openUrl);
	context.subscriptions.push(openKKJUrl);
	context.subscriptions.push(openCLSUrl);
	context.subscriptions.push(openCHUrl);
	context.subscriptions.push(openSetting);
	context.subscriptions.push(openV2exUrl);
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
	if (slowTimer) {
		clearInterval(slowTimer);
	}
};


// 定时刷新
const intervalRefrshNews = () => {
	clearAllTimer();
	vscode.commands.executeCommand('cls.refresh');
	vscode.commands.executeCommand('kkj.refresh');
	vscode.commands.executeCommand('itHome.refresh');
	timer = setInterval(() => {
		vscode.commands.executeCommand('cls.refresh');
	}, 1000 * refreshTime);
	slowTimer = setInterval(() => {
		vscode.commands.executeCommand('kkj.refresh');
		vscode.commands.executeCommand('itHome.refresh');
	}, 1000 * refreshSlowTime);
};