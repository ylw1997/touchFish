import React from "react";
import { Tag } from "antd";
import emojiData from "../data/emoji.json";

// 将表情数据转换为更易于查找的格式
const emojiMap: { [key: string]: string } = emojiData.reduce((acc, item) => {
  acc[item.phrase] = item.url;
  return acc;
}, {} as { [key: string]: string });

// 匹配 #话题#、@用户、http链接、[表情]
const regex =
  /(\[[^\]]+\]|#.*?#|@[\u4e00-\u9fa5a-zA-Z0-9_-]+|https?:\/\/[^\s]+)/g;

export const parseWeiboText = (
  text: string,
  getUserByName: (username: string) => void
): React.ReactNode[] => {
  if (!text) {
    return [];
  }

  const parts = text.split(regex);

  return parts
    .map((part, index) => {
      if (!part) {
        return null;
      }
      // 匹配 [表情]
      if (part.startsWith("[") && part.endsWith("]")) {
        const emojiUrl = emojiMap[part];
        if (emojiUrl) {
          return <img key={index} src={emojiUrl} alt={part} />;
        }
      }
      // 匹配 #话题#
      if (part.startsWith("#") && part.endsWith("#")) {
        return (
          <Tag key={index} color="cyan">
            {part.slice(1, -1)}
          </Tag>
        );
      }
      // 匹配 @用户
      if (part.startsWith("@")) {
        const username = part.substring(1);
        return (
          <Tag key={index} color="pink">
            <a
              key={index}
              onClick={() => getUserByName?.(username)}
              style={{ cursor: "pointer" }}
            >
              {part}
            </a>
          </Tag>
        );
      }
      // 匹配 http 链接
      if (part.startsWith("http")) {
        return (
          <Tag key={index} color="blue">
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
            >
              网页链接
            </a>
          </Tag>
        );
      }
      // 处理换行符并返回普通文本
      const textWithSingleBreaks = part.replace(/\n+/g, "\n");
      const textParts = textWithSingleBreaks.split("\n");
      return textParts.map((textPart, i) => (
        <React.Fragment key={`${index}-${i}`}>
          {textPart}
          {i < textParts.length - 1 && <br />}
        </React.Fragment>
      ));
    })
    .filter(Boolean);
};

// 模仿window.open 打开新窗口
export const openNewWindow = (url: string) => {
  const newWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (newWindow) {
    newWindow.opener = null; // 防止新窗口可以访问原窗口
  } else {
    console.error(
      "Failed to open new window. Please allow pop-ups for this site."
    );
  }
};
