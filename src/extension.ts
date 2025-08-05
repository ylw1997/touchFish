/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 10:26:57
 * @LastEditTime: 2025-08-05 11:31:58
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\extension.ts
 * @Description:
 */

import * as vscode from "vscode";
import {
  openUrl,
  openCHUrl,
  openV2exUrl,
  openNgaUrl,
  openZhihuUrl
} from "./commands/openUrl";
import {
  refresh,
  refreshChipHellNews,
  refreshV2exNews,
  refreshHupuNews,
  refreshNgaNews,
  refreshMixNews,
  refreshZhihuNews
} from "./commands/refresh";
import { ItHomeProvider } from "./Providers/itHomeProvider";
import { refreshTime } from "./config/index";
import {
  changeHupuTab,
  changeMixTab,
  changeNgaTab,
  changeV2exTab,
  openSetting,
} from "./commands/commands";
import { ChipHellProvider } from "./Providers/chipHellProvider";
import { V2exProvider } from "./Providers/v2exProvider";
import { HupuProvider } from "./Providers/hupuProvider";
import { defaultRefreshTime } from "./data/context";
import { NgaProvider } from "./Providers/ngaProvider";
import { ZhihuProvider } from './Providers/zhihuProvider';
import { MixProvider } from "./Providers/mixProvider";
import { WeiboProvider } from "./Providers/weiboProvider";
import ContextManager from "./utils/extensionContext";
import { Uri } from "vscode";
import * as fs from "fs";

// import { getZhihuSignature } from "./utils/signature";

// (async () => {
//   try {
//     const a = "101_3_3.0+";
//     const b = "+AFCSc2wb_RmPTtdAxKxyQyok-YuztUisHw8=|1739262461";
//     const url = `${a}/api/v4/questions/642426962/feeds?include=data[*].content&limit=30&offset=0&order=default&platform=desktop${b}`;
//     console.log("知乎加密url:", url);
//     const signatureResult = await getZhihuSignature(url);
//     console.log("知乎签名:", signatureResult);
//   } catch (error) {
//     console.error("获取知乎签名失败:", error);
//   }
// })();

let timer: NodeJS.Timeout | null = null;

export function activate(context: vscode.ExtensionContext) {
  ContextManager.initialize(context);
  // 注册树列表提供者,需要在json文件中注册(activationEvents)
  const mixProvider = new MixProvider();
  const itHomeProvider = new ItHomeProvider();
  const chiphellProvider = new ChipHellProvider();
  const v2exProvicer = new V2exProvider();
  const hupuProvider = new HupuProvider();
  const ngaProvider = new NgaProvider();
  const zhihuProvider = new ZhihuProvider();
  const weiboProvider = new WeiboProvider(context);
  vscode.window.registerTreeDataProvider("view.ithomeList", itHomeProvider);
  vscode.window.registerTreeDataProvider("view.chiphellList", chiphellProvider);
  vscode.window.registerTreeDataProvider("view.v2exList", v2exProvicer);
  vscode.window.registerTreeDataProvider("view.hupuList", hupuProvider);
  vscode.window.registerTreeDataProvider("view.ngaList", ngaProvider);
  vscode.window.registerTreeDataProvider("view.zhihuList", zhihuProvider);
  vscode.window.registerTreeDataProvider("mixView", mixProvider);
  vscode.window.registerWebviewViewProvider("weibo", weiboProvider, {
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
  context.subscriptions.push(refreshZhihuNews(zhihuProvider));
  context.subscriptions.push(changeMixTab(mixProvider));
  context.subscriptions.push(refreshMixNews(mixProvider));
  //定时刷新新闻
  intervalRefrshNews();

  //注册打开新闻链接指令
  context.subscriptions.push(openUrl);
  context.subscriptions.push(openCHUrl);
  context.subscriptions.push(openSetting);
  context.subscriptions.push(openV2exUrl);
  context.subscriptions.push(openNgaUrl);
  context.subscriptions.push(openZhihuUrl);
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
  vscode.commands.executeCommand('zhihu.refresh');
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
