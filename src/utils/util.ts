/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:38:17
 * @LastEditTime: 2025-06-20 14:00:16
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\utils\util.ts
 * @Description:
 */
import { NewsCommandType, NewsItem } from "../type/type";
import { ThemeIcon, TreeItem } from "vscode";
import { showNewsWordNumber } from "../config/index";

/**
 * 转换之家数据
 * @param dataList  数据列表
 * @returns  转换后的数据列表
 */
export const formatData = (
  dataList: NewsItem[],
  command: NewsCommandType,
  iconPath = "notebook-render-output"
): TreeItem[] => {
  const treeList: TreeItem[] = [];
  for (const i in dataList) {
    const item = dataList[i];
    const treeItem = new TreeItem(
      subStringBySize(item.title, showNewsWordNumber)
    );
    treeItem.id = item.title;
    treeItem.command = {
      title: item.title,
      command,
      arguments: [item.title, item.url],
    };
    treeItem.iconPath = item.isTop
      ? new ThemeIcon("arrow-up")
      : new ThemeIcon(iconPath);
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
export const subStringBySize = (
  str: string,
  size: number | undefined
): string => {
  if (!size) {
    return str;
  } else if (str.length > size) {
    return str.substring(0, size) + "...";
  } else {
    return str;
  }
};

/**
 * 睡眠
 * @param time 睡眠时间
 */
export const sleep = (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

//对比新老新闻列表
export const compareNews = (
  oldList: TreeItem[],
  newList: TreeItem[],
  newIcon = "bell-dot",
  oldIcon = "server-environment"
) => {
  // 如果oldList为空，则直接返回newList
  if (oldList.length === 0) {
    return newList;
  }
  const oldIds = oldList.map((item) => item.id);
  newList.map((item) => {
    if (!oldIds.includes(item.id)) {
      item.iconPath = new ThemeIcon(newIcon);
    } else {
      const topItem = new ThemeIcon("arrow-up");
      if ((item.iconPath as ThemeIcon).id !== topItem.id) {
        item.iconPath = new ThemeIcon(oldIcon);
      } else {
        item.iconPath = topItem;
      }
    }
  });
  return newList;
};