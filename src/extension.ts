/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 10:26:57
 * @LastEditTime: 2022-05-19 15:50:52
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\extension.ts
 * @Description: 
 */

import * as vscode from 'vscode';
import { DataProvider } from './DataProvider';
import { openUrl } from './commands/openUrl';
import { refresh } from './commands/refresh';

export function activate(context: vscode.ExtensionContext) {
	// 注册树列表提供者,需要在json文件中注册(activationEvents)
	const newsProvider = new DataProvider();
	vscode.window.registerTreeDataProvider("view.newsList", newsProvider);

	// 注册指令
	context.subscriptions.push(refresh(newsProvider));
	context.subscriptions.push(openUrl);
}
