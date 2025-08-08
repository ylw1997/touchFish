/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 10:26:57
 * @LastEditTime: 2025-08-08 11:18:48
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\extension.ts
 * @Description:
 */

import * as vscode from "vscode";
import {
  openUrl,
  openCHUrl,
  openV2exUrl,
  openNgaUrl
} from "./commands/openUrl";
import {
  refresh,
  refreshChipHellNews,
  refreshV2exNews,
  refreshHupuNews,
  refreshNgaNews,
} from "./commands/refresh";
import { ItHomeProvider } from "./Providers/itHomeProvider";
import { refreshTime } from "./config/index";
import {
  changeHupuTab,
  changeNgaTab,
  changeV2exTab,
  openSetting,
} from "./commands/commands";
import { ChipHellProvider } from "./Providers/chipHellProvider";
import { V2exProvider } from "./Providers/v2exProvider";
import { HupuProvider } from "./Providers/hupuProvider";
import { defaultRefreshTime } from "./data/context";
import { NgaProvider } from "./Providers/ngaProvider";
import { ZhihuWebProvider } from './Providers/zhihuWebProvider';
import { WeiboProvider } from "./Providers/weiboProvider";
import ContextManager from "./utils/extensionContext";
import { Uri } from "vscode";
import * as fs from "fs";


let timer: NodeJS.Timeout | null = null;

export function activate(context: vscode.ExtensionContext) {
  ContextManager.initialize(context);
  // 注册树列表提供者,需要在json文件中注册(activationEvents)
  const itHomeProvider = new ItHomeProvider();
  const chiphellProvider = new ChipHellProvider();
  const v2exProvicer = new V2exProvider();
  const hupuProvider = new HupuProvider();
  const ngaProvider = new NgaProvider();
  const weiboProvider = new WeiboProvider(context);
  const zhihuWebProvider = new ZhihuWebProvider(context);
  vscode.window.registerTreeDataProvider("view.ithomeList", itHomeProvider);
  vscode.window.registerTreeDataProvider("view.chiphellList", chiphellProvider);
  vscode.window.registerTreeDataProvider("view.v2exList", v2exProvicer);
  vscode.window.registerTreeDataProvider("view.hupuList", hupuProvider);
  vscode.window.registerTreeDataProvider("view.ngaList", ngaProvider);
  vscode.window.registerWebviewViewProvider("weibo", weiboProvider, {
    webviewOptions: {
      retainContextWhenHidden: true,
    },
  });
  vscode.window.registerWebviewViewProvider("zhihu", zhihuWebProvider, {
    webviewOptions: {
      retainContextWhenHidden: true,
    },
  });

  // 注册刷新指令
  context.subscriptions.push(refresh(itHomeProvider));
  context.subscriptions.push(refreshChipHellNews(chiphellProvider));
  context.subscriptions.push(refreshV2exNews(v2exProvicer));
  context.subscriptions.push(changeV2exTab(v2exProvicer));
  context.subscriptions.push(refreshHupuNews(hupuProvider));
  context.subscriptions.push(changeHupuTab(hupuProvider));
  context.subscriptions.push(refreshNgaNews(ngaProvider));
  context.subscriptions.push(changeNgaTab(ngaProvider));
  //定时刷新新闻
  intervalRefrshNews();

  //注册打开新闻链接指令
  context.subscriptions.push(openUrl);
  context.subscriptions.push(openCHUrl);
  context.subscriptions.push(openSetting);
  context.subscriptions.push(openV2exUrl);
  context.subscriptions.push(openNgaUrl);
}

// this method is called when your extension is deactivated
export function deactivate() {
  clearAllTimer();
  const tempDir = Uri.joinPath(ContextManager.context.extensionUri, "temp");
  if (fs.existsSync(tempDir.fsPath)) {
    fs.rmSync(tempDir.fsPath, { recursive: true, force: true });
  }
}

// 清除所有定时器
const clearAllTimer = () => {
  if (timer) {
    clearInterval(timer);
  }
};

const refreshAll = () => {
  vscode.commands.executeCommand("itHome.refresh");
  vscode.commands.executeCommand("v2ex.refresh");
  vscode.commands.executeCommand("hupu.refresh");
  vscode.commands.executeCommand("chiphell.refresh");
  vscode.commands.executeCommand("nga.refresh");
  vscode.commands.executeCommand ('zhihu.refresh');
};

// 定时刷新
const intervalRefrshNews = () => {
  if (timer) {
    clearInterval(timer);
  }
  refreshAll();
  const newconfig = vscode.workspace.getConfiguration("touchfish");
  const autoRefresh = newconfig.get("autoRefresh") as boolean;
  if (!autoRefresh) {
    return;
  }
  timer = setInterval(refreshAll, 1000 * (refreshTime || defaultRefreshTime));
};