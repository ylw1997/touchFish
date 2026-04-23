/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 10:26:57
 * @LastEditTime: 2026-03-18 12:15:00
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
  setXiaoyuzhouTokenCommand,
  setXTokenCommand,
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
import { XiaoyuzhouProvider } from "./Providers/xiaoyuzhouProvider";
import { XProvider } from "./Providers/xProvider";
import { WereadProvider } from "./Providers/wereadProvider";

import ContextManager from "./utils/extensionContext";
import { Uri } from "vscode";
import * as fs from "fs";
import { ReadState } from "./core/readState";
import { setConfigByKey } from "./core/config";
import { MusicStatusBar } from "./core/musicStatusBar";

type LazyTreeProviderInstance = vscode.TreeDataProvider<vscode.TreeItem> & {
  getData(tabOverride?: string): Promise<void>;
};

function createLazyTreeProvider<T extends LazyTreeProviderInstance>(
  factory: () => T,
) {
  let instance: T | undefined;
  let innerSubscription: vscode.Disposable | undefined;
  const emitter = new vscode.EventEmitter<
    vscode.TreeItem | vscode.TreeItem[] | null | undefined | void
  >();

  const getInstance = () => {
    if (!instance) {
      instance = factory();
      innerSubscription = instance.onDidChangeTreeData?.((event) => {
        emitter.fire(event);
      });
    }
    return instance;
  };

  const provider: vscode.TreeDataProvider<vscode.TreeItem> = {
    onDidChangeTreeData: emitter.event,
    getTreeItem(element) {
      return getInstance().getTreeItem(element);
    },
    getChildren(element) {
      return getInstance().getChildren(element);
    },
    getParent(element) {
      return getInstance().getParent?.(element);
    },
  };

  const dispose = () => {
    innerSubscription?.dispose();
    emitter.dispose();
  };

  return { provider, getInstance, dispose };
}

function createLazyWebviewProvider<T extends vscode.WebviewViewProvider>(
  factory: () => T,
) {
  let instance: T | undefined;
  const getInstance = () => {
    if (!instance) {
      instance = factory();
    }
    return instance;
  };

  const provider: vscode.WebviewViewProvider = {
    resolveWebviewView(webviewView, context, token) {
      return getInstance().resolveWebviewView(webviewView, context, token);
    },
  };

  return { provider, getInstance };
}

function registerLazyTreeView(
  context: vscode.ExtensionContext,
  viewId: string,
  provider: vscode.TreeDataProvider<vscode.TreeItem>,
  refreshCommand: string,
) {
  const treeView = vscode.window.createTreeView(viewId, {
    treeDataProvider: provider,
    showCollapseAll: false,
  });

  let hasLoaded = false;
  const loadOnce = async () => {
    if (hasLoaded) return;
    hasLoaded = true;
    try {
      await vscode.commands.executeCommand(refreshCommand);
    } catch (error) {
      hasLoaded = false;
      console.error(`[touchfish] lazy refresh failed: ${viewId}`, error);
    }
  };

  if (treeView.visible) {
    void loadOnce();
  }

  context.subscriptions.push(
    treeView.onDidChangeVisibility((event) => {
      if (event.visible) {
        void loadOnce();
      }
    }),
    treeView,
  );
}

export function activate(context: vscode.ExtensionContext) {
  ContextManager.initialize(context);
  ReadState.init(context);

  const itHomeProvider = createLazyTreeProvider(() => new ItHomeProvider());
  const chiphellProvider = createLazyTreeProvider(() => new ChipHellProvider());
  const v2exProvicer = createLazyTreeProvider(() => new V2exProvider());
  const hupuProvider = createLazyTreeProvider(() => new HupuProvider());
  const ngaProvider = createLazyTreeProvider(() => new NgaProvider());
  const linuxDoProvider = createLazyTreeProvider(() => new LinuxDoProvider());

  const weiboProvider = createLazyWebviewProvider(
    () => new WeiboProvider(context),
  );
  const zhihuWebProvider = createLazyWebviewProvider(
    () => new ZhihuWebProvider(context),
  );
  const xhsWebProvider = createLazyWebviewProvider(
    () => new XhsWebProvider(context),
  );
  const bilibiliProvider = createLazyWebviewProvider(
    () => new BilibiliProvider(context),
  );
  const qqmusicProvider = createLazyWebviewProvider(
    () => new QQMusicProvider(context),
  );
  const xiaoyuzhouProvider = createLazyWebviewProvider(
    () => new XiaoyuzhouProvider(context),
  );
  const xProvider = createLazyWebviewProvider(
    () => new XProvider(context),
  );
  const wereadProvider = createLazyWebviewProvider(
    () => new WereadProvider(context),
  );

  registerLazyTreeView(
    context,
    "view.ithomeList",
    itHomeProvider.provider,
    "itHome.refresh",
  );
  registerLazyTreeView(
    context,
    "view.chiphellList",
    chiphellProvider.provider,
    "chiphell.refresh",
  );
  registerLazyTreeView(
    context,
    "view.v2exList",
    v2exProvicer.provider,
    "v2ex.refresh",
  );
  registerLazyTreeView(
    context,
    "view.hupuList",
    hupuProvider.provider,
    "hupu.refresh",
  );
  registerLazyTreeView(
    context,
    "view.ngaList",
    ngaProvider.provider,
    "nga.refresh",
  );
  registerLazyTreeView(
    context,
    "view.linuxdoList",
    linuxDoProvider.provider,
    "linuxdo.refresh",
  );

  vscode.window.registerWebviewViewProvider("weibo", weiboProvider.provider, {
    webviewOptions: {
      retainContextWhenHidden: true,
    },
  });
  vscode.window.registerWebviewViewProvider(
    "zhihu",
    zhihuWebProvider.provider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    },
  );
  vscode.window.registerWebviewViewProvider("xhs", xhsWebProvider.provider, {
    webviewOptions: {
      retainContextWhenHidden: true,
    },
  });
  vscode.window.registerWebviewViewProvider(
    "bilibili",
    bilibiliProvider.provider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    },
  );
  vscode.window.registerWebviewViewProvider(
    "qqmusic",
    qqmusicProvider.provider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    },
  );
  vscode.window.registerWebviewViewProvider(
    "xiaoyuzhou",
    xiaoyuzhouProvider.provider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    },
  );
  vscode.window.registerWebviewViewProvider(
    "x",
    xProvider.provider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    },
  );
  vscode.window.registerWebviewViewProvider(
    "weread",
    wereadProvider.provider,
    {
      webviewOptions: {
        retainContextWhenHidden: true,
      },
    },
  );

  context.subscriptions.push(refresh(itHomeProvider.getInstance));
  context.subscriptions.push(refreshChipHellNews(chiphellProvider.getInstance));
  context.subscriptions.push(refreshV2exNews(v2exProvicer.getInstance));
  context.subscriptions.push(changeV2exTab(v2exProvicer.getInstance));
  context.subscriptions.push(refreshHupuNews(hupuProvider.getInstance));
  context.subscriptions.push(changeHupuTab(hupuProvider.getInstance));
  context.subscriptions.push(refreshNgaNews(ngaProvider.getInstance));
  context.subscriptions.push(changeNgaTab(ngaProvider.getInstance));
  context.subscriptions.push(refreshLinuxDoNews(linuxDoProvider.getInstance));

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
  context.subscriptions.push(setXiaoyuzhouTokenCommand());
  context.subscriptions.push(setXTokenCommand());
  context.subscriptions.push(
    vscode.commands.registerCommand("touchfish.setWereadCookie", async () => {
      const cookie = await vscode.window.showInputBox({
        prompt: "请输入微信读书 Cookie",
        placeHolder: "wr_skey=...; wr_vid=...;",
      });
      if (cookie) {
        await setConfigByKey("wereadCookie", cookie);
        vscode.window.showInformationMessage("微信读书 Cookie 设置成功");
      }
    }),
  );

  context.subscriptions.push(
    MusicStatusBar.getInstance().onPlaybackInterrupt((newModule) => {
      if (newModule === "qqmusic") {
        xiaoyuzhouProvider.getInstance()["pause"]?.();
      } else if (newModule === "xiaoyuzhou") {
        qqmusicProvider.getInstance()["pause"]?.();
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("touchfish.openQQMusic", async () => {
      await vscode.commands.executeCommand("qqmusic.focus");
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("touchfish.openXiaoyuzhou", async () => {
      await vscode.commands.executeCommand("xiaoyuzhou.focus");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("touchfish.music.openActive", async () => {
      const activeModule = MusicStatusBar.getInstance().getActiveModule();
      if (activeModule === "qqmusic") {
        await vscode.commands.executeCommand("qqmusic.focus");
      } else if (activeModule === "xiaoyuzhou") {
        await vscode.commands.executeCommand("xiaoyuzhou.focus");
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("touchfish.music.playPause", async () => {
      const activeModule = MusicStatusBar.getInstance().getActiveModule();
      if (activeModule === "qqmusic") {
        qqmusicProvider.getInstance()["sendPlayPauseCommand"]?.();
      } else if (activeModule === "xiaoyuzhou") {
        xiaoyuzhouProvider.getInstance()["sendPlayPauseCommand"]?.();
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("touchfish.music.next", async () => {
      const activeModule = MusicStatusBar.getInstance().getActiveModule();
      if (activeModule === "qqmusic") {
        qqmusicProvider.getInstance()["sendNextSongCommand"]?.();
      } else if (activeModule === "xiaoyuzhou") {
        xiaoyuzhouProvider.getInstance()["sendNextEpisodeCommand"]?.();
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("touchfish.qqmusic.playPause", async () => {
      qqmusicProvider.getInstance()["sendPlayPauseCommand"]?.();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("touchfish.qqmusic.nextSong", async () => {
      qqmusicProvider.getInstance()["sendNextSongCommand"]?.();
    }),
  );

  context.subscriptions.push(
    { dispose: itHomeProvider.dispose },
    { dispose: chiphellProvider.dispose },
    { dispose: v2exProvicer.dispose },
    { dispose: hupuProvider.dispose },
    { dispose: ngaProvider.dispose },
    { dispose: linuxDoProvider.dispose },
  );
}

export function deactivate() {
  const tempDir = Uri.joinPath(ContextManager.context.extensionUri, "temp");
  if (fs.existsSync(tempDir.fsPath)) {
    fs.rmSync(tempDir.fsPath, { recursive: true, force: true });
  }
}
