/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 10:26:57
 * @LastEditTime: 2025-10-22 08:57:00
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
  openLinuxDoUrl,
} from "./commands/openUrl";
import {
  refresh,
  refreshChipHellNews,
  refreshV2exNews,
  refreshHupuNews,
  refreshNgaNews,
  refreshLinuxDoNews,
} from "./commands/refresh";
import { ItHomeProvider } from "./Providers/itHomeProvider";
import {
  changeHupuTab,
  changeNgaTab,
  changeV2exTab,
  openSetting,
  setZhihuTokenCommand,
  setWeiboTokenCommand,
  setWeiboUserIdCommand,
  setNgaTokenCommand,
  setXhsTokenCommand,
  setLinuxDoTokenCommand,
  switchLinuxDoTab,
  setBilibiliTokenCommand,
} from "./commands/commands";
import { ChipHellProvider } from "./Providers/chipHellProvider";
import { V2exProvider } from "./Providers/v2exProvider";
import { HupuProvider } from "./Providers/hupuProvider";
import { NgaProvider } from "./Providers/ngaProvider";
import { LinuxDoProvider } from "./Providers/linuxDoProvider";
import { ZhihuWebProvider } from "./Providers/zhihuWebProvider";
import { XhsWebProvider } from "./Providers/xhsWebProvider";
import { WeiboProvider } from "./Providers/weiboProvider";
import { BilibiliProvider } from "./Providers/bilibiliProvider";
import { QQMusicProvider } from "./Providers/qqmusicProvider";
import ContextManager from "./utils/extensionContext";
import { Uri } from "vscode";
import * as fs from "fs";
// config/index.ts 已移除，配置动态读取，不再需要 refrshConfig。
import { ReadState } from "./core/readState";

export function activate(context: vscode.ExtensionContext) {
  ContextManager.initialize(context);
  ReadState.init(context);
  // 注册树列表提供者,需要在json文件中注册(activationEvents)
  const itHomeProvider = new ItHomeProvider();
  const chiphellProvider = new ChipHellProvider();
  const v2exProvicer = new V2exProvider();
  const hupuProvider = new HupuProvider();
  const ngaProvider = new NgaProvider();
  const linuxDoProvider = new LinuxDoProvider();
  const weiboProvider = new WeiboProvider(context);
  const zhihuWebProvider = new ZhihuWebProvider(context);
  const xhsWebProvider = new XhsWebProvider(context);
  const bilibiliProvider = new BilibiliProvider(context);
  const qqmusicProvider = new QQMusicProvider(context);
  vscode.window.registerTreeDataProvider("view.ithomeList", itHomeProvider);
  vscode.window.registerTreeDataProvider("view.chiphellList", chiphellProvider);
  vscode.window.registerTreeDataProvider("view.v2exList", v2exProvicer);
  vscode.window.registerTreeDataProvider("view.hupuList", hupuProvider);
  vscode.window.registerTreeDataProvider("view.ngaList", ngaProvider);
  vscode.window.registerTreeDataProvider("view.linuxdoList", linuxDoProvider);
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
  vscode.window.registerWebviewViewProvider("xhs", xhsWebProvider, {
    webviewOptions: {
      retainContextWhenHidden: true,
    },
  });
  vscode.window.registerWebviewViewProvider("bilibili", bilibiliProvider, {
    webviewOptions: {
      retainContextWhenHidden: true,
    },
  });
  vscode.window.registerWebviewViewProvider("qqmusic", qqmusicProvider, {
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
  context.subscriptions.push(refreshLinuxDoNews(linuxDoProvider));

  //注册打开新闻链接指令
  context.subscriptions.push(openUrl);
  context.subscriptions.push(openCHUrl);
  context.subscriptions.push(openSetting);
  context.subscriptions.push(openV2exUrl);
  context.subscriptions.push(openNgaUrl);
  context.subscriptions.push(openLinuxDoUrl);
  context.subscriptions.push(setZhihuTokenCommand());
  context.subscriptions.push(setWeiboTokenCommand());
  context.subscriptions.push(setWeiboUserIdCommand());
  context.subscriptions.push(setNgaTokenCommand());
  context.subscriptions.push(setXhsTokenCommand());
  context.subscriptions.push(setLinuxDoTokenCommand());
  context.subscriptions.push(switchLinuxDoTab());
  context.subscriptions.push(setBilibiliTokenCommand());

  // 注册 QQ 音乐相关命令
  context.subscriptions.push(
    vscode.commands.registerCommand("touchfish.openQQMusic", async () => {
      await vscode.commands.executeCommand("qqmusic.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("touchfish.qqmusic.playPause", async () => {
      qqmusicProvider["sendPlayPauseCommand"]?.();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("touchfish.qqmusic.nextSong", async () => {
      qqmusicProvider["sendNextSongCommand"]?.();
    })
  );

  // 自动刷新
  vscode.commands.executeCommand("itHome.refresh");
  vscode.commands.executeCommand("chiphell.refresh");
  vscode.commands.executeCommand("v2ex.refresh");
  vscode.commands.executeCommand("hupu.refresh");
  vscode.commands.executeCommand("nga.refresh");
  vscode.commands.executeCommand("linuxdo.refresh");
}

// this method is called when your extension is deactivated
export function deactivate() {
  const tempDir = Uri.joinPath(ContextManager.context.extensionUri, "temp");
  if (fs.existsSync(tempDir.fsPath)) {
    fs.rmSync(tempDir.fsPath, { recursive: true, force: true });
  }
}
