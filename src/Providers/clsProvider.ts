/*
 * @Author: YangLiwei
 * @Date: 2022-05-23 10:50:00
 * @LastEditTime: 2024-09-18 14:25:37
 * @LastEditors: yangliwei 1280426581@qq.com
 * @FilePath: \touchfish\src\Providers\clsProvider.ts
 * @Description: 
 */
import * as vscode from 'vscode';
import { getCLSNewsList } from '../api/cls';
import { compareNews, formatData } from '../utils/util';
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
        // this.newsList = [];
        await getCLSNewsList().then(res => {
            // 当前页面的数据
            const news = formatData(res,"cls.openUrl","server-environment").slice(0,showNewsNumber);
            this.newsList = compareNews(this.newsList,news);
        });
        this.update.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(): ProviderResult<vscode.TreeItem[]> {
        return this.newsList;
    }
}

