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
// Removed showNewsWordNumber truncation feature
import { ZhihuHotItem, ZhihuHotQuestion, ZhihuItemData } from "../../type";

/**
 * 转换之家数据
 * @param dataList  数据列表
 * @returns  转换后的数据列表
 */
export interface FormatNewsInput extends NewsItem {
  id?: string;            // 唯一ID（新）
  tooltip?: string;       // 提示文本
  read?: boolean;         // 已读状态
}

export const formatData = (
  dataList: FormatNewsInput[],
  command: NewsCommandType,
  iconPath = "notebook-render-output"
): TreeItem[] => {
  const treeList: TreeItem[] = [];
  for (const i of dataList) {
    const treeItem = new TreeItem(i.title);
    treeItem.id = i.id || i.url || i.title; // 兜底
    treeItem.tooltip = i.tooltip || i.url || i.title;
    treeItem.command = {
      title: i.title,
      command,
      arguments: [i.title, i.url, treeItem.id], // 追加 id 供命令侧写已读
    };
    if (i.read) {
      treeItem.iconPath = new ThemeIcon('eye');
    } else {
      treeItem.iconPath = i.isTop ? new ThemeIcon('arrow-up') : new ThemeIcon(iconPath);
    }
    treeList.push(treeItem);
  }
  return treeList;
};

// subStringBySize removed: titles now display full length

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
    // 已读 (eye) 保持不变
    const iconId = (item.iconPath as ThemeIcon).id;
    const isRead = iconId === 'eye';
    if (isRead) return; // 已读优先
    if (!oldIds.includes(item.id)) {
      // 新出现的新闻：如果不是已读，再标记为新图标；若已读则保持 eye
      if (iconId !== 'eye') {
        item.iconPath = new ThemeIcon(newIcon);
      }
      return;
    }
    const topItem = new ThemeIcon('arrow-up');
    if (iconId === topItem.id) {
      item.iconPath = topItem; // 置顶保持
    } else {
      item.iconPath = new ThemeIcon(oldIcon);
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
