/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 10:26:57
 * @LastEditTime: 2022-05-20 11:26:02
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\extension.ts
 * @Description: 
 */

import * as vscode from 'vscode';
import { openUrl } from './commands/openUrl';
import { refresh } from './commands/refresh';
import { ItHomeProvider } from './Providers/itHomeProvider';

export function activate(context: vscode.ExtensionContext) {
	// 注册树列表提供者,需要在json文件中注册(activationEvents)
	const newsProvider = new ItHomeProvider();
	vscode.window.registerTreeDataProvider("view.newsList", newsProvider);
	vscode.window.registerTreeDataProvider("view.kkjList", newsProvider);

	// 注册指令
	context.subscriptions.push(refresh(newsProvider));
	context.subscriptions.push(openUrl);
}
