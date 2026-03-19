import * as vscode from 'vscode';

export const setConfigByKey = async (key: string, value: string) => {
  const cfg = vscode.workspace.getConfiguration('touchfish');
  return cfg.update(key, value, true);
};
