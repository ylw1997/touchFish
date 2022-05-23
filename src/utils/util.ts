/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:38:17
 * @LastEditTime: 2022-05-23 11:12:21
 * @LastEditors: YangLiwei
 * @FilePath: \hello-world\src\utils\util.ts
 * @Description: 
 */
import { NewsItem, kkjNewsItem, clsNewsItem } from '../type/type';
import { ThemeIcon, TreeItem } from 'vscode';
import { showNewsWordNumber } from '../config/index';

/**
 * 转换之家数据
 * @param dataList  数据列表
 * @returns  转换后的数据列表
 */
export const formatData = (dataList: NewsItem[]): TreeItem[] => {
  let treeList: TreeItem[] = [];
  for (let i in dataList) {
    let item = dataList[i];
    let treeItem = new TreeItem(subStringBySize(item.title, showNewsWordNumber));
    // treeItem.description = item.description;
    treeItem.id = item.newsid.toString();
    treeItem.command = {
      title: item.title,
      command: "itHome.openUrl",
      arguments: [item.title, item.postdate, item.newsid]
    };
    treeItem.iconPath = new ThemeIcon("notebook-render-output");
    treeList.push(treeItem);
  }
  return treeList;
};

/**
 *  快科技新闻数据转换
 * @param dataList  数据列表
 * @returns 转换后的数据列表
 */
export const formatKKJData = (dataList: kkjNewsItem[]): TreeItem[] => {
  let treeList: TreeItem[] = [];
  for (let i in dataList) {
    let item = dataList[i];
    let treeItem = new TreeItem(subStringBySize(item.title, showNewsWordNumber));
    treeItem.id = item.title;
    treeItem.command = {
      title: item.title,
      command: "kkj.openUrl",
      arguments: [item.title, item.url]
    };
    treeItem.iconPath = new ThemeIcon("comment");
    treeList.push(treeItem);
  }
  return treeList;
};

/**
 * 财联社新闻数据转换
 * @param dataList  数据列表
 * @returns  转换后的数据列表
 */
export const formatCLSData = (dataList:clsNewsItem[]):TreeItem[] => {
  let treeList: TreeItem[] = [];
  for (let i in dataList) {
    let item = dataList[i];
    let treeItem = new TreeItem(subStringBySize(item.title, showNewsWordNumber));
    treeItem.id = item.title;
    treeItem.command = {
      title: item.title,
      command: "cls.openUrl",
      arguments: [item.title, item.content]
    };
    treeItem.iconPath = new ThemeIcon("server-environment");
    treeList.push(treeItem);
  }
  return treeList;
};

/**
 *  截取字符串
 * @param str 字符串
 * @param size  截取长度
 * @returns  截取后的字符串
 */
export const subStringBySize = (str: string, size: number): string => {
  if (str.length > size) {
    return str.substring(0, size) + '...';
  }
  return str;
};

/**
 * 睡眠
 * @param time 睡眠时间 
 */
export const sleep = (time: number) => {
  return new Promise(resolve => setTimeout(resolve, time));
};