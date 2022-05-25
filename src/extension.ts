/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 10:26:57
 * @LastEditTime: 2022-05-25 10:56:53
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\extension.ts
 * @Description: 
 */

import * as vscode from 'vscode';
import { openUrl, openKKJUrl, openCLSUrl } from './commands/openUrl';
import { refresh, kkjRefresh, clsRefresh } from './commands/refresh';
import { ClsProvider } from './Providers/clsProvider';
import { ItHomeProvider } from './Providers/itHomeProvider';
import { KKJProvider } from './Providers/kkjProvider';
import { printConfig, refreshTime, refrshConfig } from './config/index';
import { openSetting } from './commands/commands';

let timer: NodeJS.Timeout | null = null;

export function activate(context: vscode.ExtensionContext) {
	// 注册树列表提供者,需要在json文件中注册(activationEvents)
	const newsProvider = new ItHomeProvider();
	const kkjProvider = new KKJProvider();
	const clsProvider = new ClsProvider();
	vscode.window.registerTreeDataProvider("view.newsList", newsProvider);
	vscode.window.registerTreeDataProvider("view.kkjList", kkjProvider);
	vscode.window.registerTreeDataProvider("view.clsList", clsProvider);

	// 注册刷新指令
	context.subscriptions.push(refresh(newsProvider));
	context.subscriptions.push(kkjRefresh(kkjProvider));
	context.subscriptions.push(clsRefresh(clsProvider));

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
	context.subscriptions.push(openSetting);
}

// this method is called when your extension is deactivated
export function deactivate() {
	if (timer) {
		clearInterval(timer);
	}
}


// 定时刷新
const intervalRefrshNews = () => {
	if (timer) {
		clearInterval(timer);
	}
	refreshNewsFunc();
	timer = setInterval(() => {
		refreshNewsFunc();
		console.log('刷新新闻数据!', Date());
	}, 1000 * refreshTime);
};

// 刷新新闻方法
const refreshNewsFunc = () => {
	vscode.commands.executeCommand('cls.refresh');
	vscode.commands.executeCommand('kkj.refresh');
	vscode.commands.executeCommand('itHome.refresh');
};