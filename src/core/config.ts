import * as vscode from 'vscode';

export const setConfigByKey = async (key: string, value: string) => {
  const cfg = vscode.workspace.getConfiguration('touchfish');
  // 使用全局配置 (true = 全局)
  await cfg.update(key, value, true);
};

export const getConfigByKey = (key: string): string | undefined => {
  const cfg = vscode.workspace.getConfiguration('touchfish');
  // 优先检查工作区配置，如果没有则使用全局配置
  return cfg.get(key) as string | undefined;
};
