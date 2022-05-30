/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 10:26:57
 * @LastEditTime: 2022-05-30 10:32:10
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\extension.ts
 * @Description: 
 */

import * as vscode from 'vscode';
import { openUrl, openKKJUrl, openCLSUrl, openCHUrl } from './commands/openUrl';
import { refresh, kkjRefresh, clsRefresh, refreshChipHellNews } from './commands/refresh';
import { ClsProvider } from './Providers/clsProvider';
import { ItHomeProvider } from './Providers/itHomeProvider';
import { KKJProvider } from './Providers/kkjProvider';
import { printConfig, refreshSlowTime, refreshTime, refrshConfig } from './config/index';
import { openSetting } from './commands/commands';
import { ChipHellProvider } from './Providers/chipHellProvider';

let timer: NodeJS.Timeout | null = null;
let slowTimer: NodeJS.Timeout | null = null;

export function activate(context: vscode.ExtensionContext) {
	// 注册树列表提供者,需要在json文件中注册(activationEvents)
	const newsProvider = new ItHomeProvider();
	const kkjProvider = new KKJProvider();
	const clsProvider = new ClsProvider();
	const chiphellProvider = new ChipHellProvider();
	vscode.window.registerTreeDataProvider("view.newsList", newsProvider);
	vscode.window.registerTreeDataProvider("view.kkjList", kkjProvider);
	vscode.window.registerTreeDataProvider("view.clsList", clsProvider);
	vscode.window.registerTreeDataProvider("view.chiphellList", chiphellProvider);

	// 注册刷新指令
	context.subscriptions.push(refresh(newsProvider));
	context.subscriptions.push(kkjRefresh(kkjProvider));
	context.subscriptions.push(clsRefresh(clsProvider));
	context.subscriptions.push(refreshChipHellNews(chiphellProvider));

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
		console.log('刷新财联社新闻数据!', Date());
	}, 1000 * refreshTime);
	slowTimer = setInterval(() => {
		vscode.commands.executeCommand('kkj.refresh');
		vscode.commands.executeCommand('itHome.refresh');
		console.log('刷新it之家,快科技新闻数据!', Date());
	}, 1000 * refreshSlowTime);
};