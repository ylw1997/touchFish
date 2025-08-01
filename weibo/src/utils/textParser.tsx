import React from "react";
import { Tag } from "antd";
import emojiData from "../data/emoji.json";
import { baseWeiboField } from "../../../type";
import { openNewWindow } from ".";

// 使用 Map 进行高效的表情查找。它仅在模块加载时创建一次。
const emojiMap = new Map<string, string>(
  emojiData.map((item) => [item.phrase, item.url])
);

// 用于查找所有特殊实体（[表情]、#话题#、@用户 或 URL）的正则表达式。
const regex =
  /(\[[^\]]+\]|#.*?#|@[\u4e00-\u9fa5a-zA-Z0-9_-]+|https?:\/\/[^\s]+)/g;

/**
 * 渲染文本字符串，将换行符转换成 <br> 标签。
 * 它会将多个连续的换行符折叠成一个。
 */
const renderTextWithLineBreaks = (text: string, baseKey: string | number) => {
  if (!text) return null;
  const textParts = text.replace(/\n+/g, "\n").split("\n");
  return (
    <React.Fragment key={baseKey}>
      {textParts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < textParts.length - 1 && <br />}
        </React.Fragment>
      ))}
    </React.Fragment>
  );
};

/**
 * 解析微博原始文本，并将其转换为 React 节点数组。
 * 它可以处理表情、话题、@用户和链接。
 * 此版本使用 `matchAll` 以获得更好的性能和代码结构。
 */
export const parseWeiboText = (
  weiboItem: baseWeiboField,
  getUserByName: (username: string) => void,
  onTopicClick: (topic: string) => void,
  isComment = false,
): React.ReactNode[] => {
  const { text_raw, page_info } = weiboItem;
  if (!text_raw) {
    return [];
  }

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  // 使用 matchAll 查找所有特殊模式的出现。
  const matches = text_raw.matchAll(regex);

  for (const match of matches) {
    const part = match[0];
    const index = match.index!;

    // 1. 添加匹配实体之前的纯文本。
    if (index > lastIndex) {
      const textBefore = text_raw.substring(lastIndex, index);
      nodes.push(renderTextWithLineBreaks(textBefore, `text-${lastIndex}`));
    }

    // 2. 处理并添加匹配的实体。
    const key = `match-${index}`;
    if (part.startsWith("[") && part.endsWith("]")) {
      const emojiUrl = emojiMap.get(part);
      if (emojiUrl) {
        nodes.push(<img key={key} src={emojiUrl} alt={part} className="weibo-emoji" />);
      } else {
        // 如果表情不在我们的 Map 中，则将其渲染为纯文本。
        nodes.push(part);
      }
    } else if (part.startsWith("#") && part.endsWith("#")) {
      nodes.push(
        <Tag
          key={key}
          color="cyan"
          className="link-tag"
          onClick={() => onTopicClick?.(part)}
        >
          {part}
        </Tag>
      );
    } else if (part.startsWith("@")) {
      const username = part.substring(1);
      nodes.push(
        <Tag
          key={key}
          color="pink"
          className="link-tag"
          onClick={() => getUserByName?.(username)}
        >
          {part}
        </Tag>
      );
    } else if (part.startsWith("http")) {
      if (isComment) {
        continue; // 在评论中，我们不渲染链接。
      }
      let linkText = "网页链接";
      let color = "blue";
      if (page_info?.object_type === "video" || page_info?.object_type === "live") {
        linkText = "视频链接";
        color = "green";
      } else if (page_info?.object_type === "hudongvote") {
        linkText = "投票链接";
        color = "orange";
      }
      nodes.push(
        <Tag
          key={key}
          color={color}
          className="link-tag"
          onClick={() => openNewWindow(part)}
        >
          {linkText}
        </Tag>
      );
    }

    lastIndex = index + part.length;
  }

  // 3. 添加最后一次匹配后的所有剩余纯文本。
  if (lastIndex < text_raw.length) {
    const textAfter = text_raw.substring(lastIndex);
    nodes.push(renderTextWithLineBreaks(textAfter, `text-${lastIndex}`));
  }

  return nodes.filter(Boolean);
};