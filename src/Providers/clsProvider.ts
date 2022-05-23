/*
 * @Author: YangLiwei
 * @Date: 2022-05-23 10:50:00
 * @LastEditTime: 2022-05-23 11:10:19
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\Providers\clsProvider.ts
 * @Description: 
 */
import * as vscode from 'vscode';
import { getCLSNewsList } from '../api/cls';
import { formatCLSData } from '../utils/util';
import { ProviderResult } from 'vscode';
import { showNewsNumber } from '../config/index';

/**
 * 获取财联社新闻列表
 */
export class ClsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private newsList: vscode.TreeItem[] = [];
    private update = new vscode.EventEmitter<vscode.TreeItem | void>();
    readonly onDidChangeTreeData = this.update.event;

    constructor() {
        this.getData();
    }

    async getData() {
        this.newsList = [];
        await getCLSNewsList().then(res => {
            this.newsList = formatCLSData(res).slice(0,showNewsNumber);
        });
        this.update.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: vscode.TreeItem): ProviderResult<vscode.TreeItem[]> {
        return this.newsList;
    }
}

