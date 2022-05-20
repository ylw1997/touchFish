/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 10:26:57
 * @LastEditTime: 2022-05-20 15:49:01
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\extension.ts
 * @Description: 
 */

import * as vscode from 'vscode';
import { openUrl, openKKJUrl } from './commands/openUrl';
import { refresh, kkjRefresh } from './commands/refresh';
import { ItHomeProvider } from './Providers/itHomeProvider';
import { KKJProvider } from './Providers/kkjProvider';

export function activate(context: vscode.ExtensionContext) {
	// 注册树列表提供者,需要在json文件中注册(activationEvents)
	const newsProvider = new ItHomeProvider();
	const kkjProvider = new KKJProvider();
	vscode.window.registerTreeDataProvider("view.newsList", newsProvider);
	vscode.window.registerTreeDataProvider("view.kkjList", kkjProvider);

	// 注册刷新指令
	context.subscriptions.push(refresh(newsProvider));
	context.subscriptions.push(kkjRefresh(kkjProvider));

	//注册打开新闻链接指令
	context.subscriptions.push(openUrl);
	context.subscriptions.push(openKKJUrl);
}
