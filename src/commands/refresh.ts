/*
 * @Author: YangLiwei
 * @Date: 2022-05-19 14:11:31
 * @LastEditTime: 2026-03-18 12:05:00
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\commands\refresh.ts
 * @Description:
 */
import * as vscode from "vscode";

type RefreshableProvider = {
  getData(tabOverride?: string): Promise<void>;
};

/**
 * 鍒锋柊涔嬪鏍戝垪琛?
 * @param getProvider 鏁版嵁鎻愪緵鑰呰幏鍙栧櫒
 * @returns 鎸囦护
 */
export const refresh = (getProvider: () => RefreshableProvider) => {
  return vscode.commands.registerCommand("itHome.refresh", async () => {
    await getProvider().getData();
  });
};

export const refreshChipHellNews = (getProvider: () => RefreshableProvider) => {
  return vscode.commands.registerCommand("chiphell.refresh", async () => {
    await getProvider().getData();
  });
};

export const refreshV2exNews = (getProvider: () => RefreshableProvider) => {
  return vscode.commands.registerCommand("v2ex.refresh", async () => {
    await getProvider().getData(
      vscode.workspace.getConfiguration("touchfish").get("v2exTab") as string,
    );
  });
};

export const refreshHupuNews = (getProvider: () => RefreshableProvider) => {
  return vscode.commands.registerCommand("hupu.refresh", async () => {
    await getProvider().getData(
      vscode.workspace.getConfiguration("touchfish").get("hupuTab") as string,
    );
  });
};

export const refreshNgaNews = (getProvider: () => RefreshableProvider) => {
  return vscode.commands.registerCommand("nga.refresh", async () => {
    await getProvider().getData(
      vscode.workspace.getConfiguration("touchfish").get("ngaTab") as string,
    );
  });
};

export const refreshLinuxDoNews = (getProvider: () => RefreshableProvider) => {
  return vscode.commands.registerCommand("linuxdo.refresh", async () => {
    await getProvider().getData();
  });
};
