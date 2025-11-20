import * as vscode from 'vscode';

export const showError = (message: string, ...items: string[]) => {
  return vscode.window.showErrorMessage(message, ...items);
};

export const showInfo = (message: string, ...items: string[]) => {
  return vscode.window.showInformationMessage(message, ...items);
};

export const showWarn = (message: string, ...items: string[]) => {
  return vscode.window.showWarningMessage(message, ...items);
};