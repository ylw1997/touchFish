/*
 * @Author: YangLiwei
 * @Date: 2022-05-18 15:38:17
 * @LastEditTime: 2025-09-25 15:06:01
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\utils\util.ts
 * @Description:
 */
import { NewsCommandType, NewsItem } from "../type/type";
import { ThemeIcon, TreeItem } from "vscode";
import { showNewsWordNumber } from "../config/index";
import { ZhihuHotItem, ZhihuHotQuestion, ZhihuItemData } from "../../type";

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

export const zhihuContentImage = (content: string): string => {
  return content.replace(/<img[^>]*>/g, (imgTag) => {
    const dataSrcMatch = imgTag.match(/data-src="([^"]+)"/);
    const dataOriginalMatch = imgTag.match(/data-original="([^"]+)"/);
    const imageUrl = dataSrcMatch?.[1] || dataOriginalMatch?.[1];
    if (imageUrl) {
      let newImgTag = imgTag;
      // 如果有 src 属性，替换它
      if (newImgTag.includes("src=")) {
        newImgTag = newImgTag.replace(/src="[^"]+"/, `src="${imageUrl}"`);
      } else {
        // 否则，添加 src 属性
        newImgTag = newImgTag.replace("<img", `<img src="${imageUrl}"`);
      }
      return newImgTag;
    }
    return imgTag;
  });
};

// 转换知乎热榜
export const convertZhihuHotItemToZhihuItemData = (
  hotItem: ZhihuHotItem,
  index?: number
): ZhihuItemData => {
  const id = hotItem.link.url.split("/").pop() || "";
  return {
    id,
    question: {
      id,
      title: hotItem.title_area.text,
    },
    author: {
      id: "0",
      name: "热榜",
      avatar_url: "https://pica.zhimg.com/aadd7b895_s.jpg",
    },
    excerpt: hotItem.excerpt_area.text,
    metrics_area: hotItem.metrics_area.text,
    image_area: hotItem.image_area.url,
    index,
    type: "answer",
    tab: "hot",
  };
};

// 转换知乎热门问题
export const convertZhihuHotQuestionToZhihuItemData = (
  hotQuestion: ZhihuHotQuestion
): ZhihuItemData => {
  const id = hotQuestion.question.id;
  return {
    id,
    excerpt: hotQuestion.question.excerpt
      ? hotQuestion.question.excerpt
      : hotQuestion.reason,
    content: hotQuestion.question.detail
      ? hotQuestion.question.detail
      : hotQuestion.reason,
    type: "answer",
    question: {
      id,
      title: hotQuestion.question.title,
    },
    author: {
      ...hotQuestion.question.author,
    },
    metrics_area: `${hotQuestion.question.answer_count} 回答`,
    tab: "hot_question",
  };
};

// 对NewsItem数组去重
export const uniqueNews = (newsList: NewsItem[]) => {
  const uniqueMap = new Map<string, NewsItem>();
  newsList.forEach((item) => {
    uniqueMap.set(item.title, item);
  });
  return Array.from(uniqueMap.values());
};
