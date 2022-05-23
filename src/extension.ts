/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 10:26:57
 * @LastEditTime: 2022-05-23 11:49:08
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
	
	//定时刷新新闻,每30秒刷新
	setInterval(()=>{
		vscode.commands.executeCommand('cls.refresh');
		vscode.commands.executeCommand('kkj.refresh');
		vscode.commands.executeCommand('itHome.refresh');
		console.log('刷新财联社数据!');
	},1000*30);

	//注册打开新闻链接指令
	context.subscriptions.push(openUrl);
	context.subscriptions.push(openKKJUrl);
	context.subscriptions.push(openCLSUrl);
}
