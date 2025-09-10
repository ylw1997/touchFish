import { Image } from "antd";
import React from "react";

const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];

/**
 * 一个通用的HTML字符串解析器，使用正则表达式查找匹配项，
 * 并将它们替换为React组件。
 * @param htmlString 要解析的HTML字符串。
 * @param regex 用于查找匹配项的正则表达式。
 * @param processMatch 一个将匹配项转换为React节点的函数。
 * @returns 包含解析后内容的React片段。
 */
const parseHtmlString = (
  htmlString: string | undefined,
  regex: RegExp,
  processMatch: (match: RegExpExecArray) => React.ReactNode
) => {
  if (!htmlString) {
    return null;
  }

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;

  // 使用 matchAll 迭代所有匹配项，这比传统的 while 循环更现代、更具可读性。
  for (const match of htmlString.matchAll(regex)) {
    const matchIndex = match.index!; // match.index 在 matchAll 的结果中始终存在

    // 1. 添加当前匹配项之前的文本
    if (matchIndex > lastIndex) {
      elements.push(
        <span
          key={`text-${lastIndex}`}
          dangerouslySetInnerHTML={{
            __html: htmlString.substring(lastIndex, matchIndex),
          }}
        />
      );
    }

    // 2. 处理当前匹配项并添加生成的React节点
    elements.push(processMatch(match as RegExpExecArray));

    lastIndex = matchIndex + match[0].length;
  }

  // 3. 添加最后一个匹配项之后的任何剩余文本
  if (lastIndex < htmlString.length) {
    elements.push(
      <span
        key={`text-${lastIndex}`}
        dangerouslySetInnerHTML={{ __html: htmlString.substring(lastIndex) }}
      />
    );
  }

  return <>{elements}</>;
};

/**
 * 处理知乎评论内容，将链接到图片的 <a> 标签
 * 转换为 Ant Design 的 <Image> 组件。
 * @param htmlString 评论的HTML内容。
 * @returns 包含解析后内容的React片段。
 */
export const processCommentContent = (htmlString: string | undefined) => {
  const regex = /<a.*?href="(.*?)".*?>(.*?)<\/a>/g;

  return parseHtmlString(htmlString, regex, (match) => {
    const [fullMatch, href, text] = match;
    const isImage = imageExtensions.some((ext) =>
      href.toLowerCase().endsWith(ext)
    );

    if (isImage) {
      return <Image key={`image-${match.index}`} src={href} alt={text} />;
    } else {
      // 如果链接不是图片，则保留为常规链接。
      return (
        <span
          key={`link-${match.index}`}
          dangerouslySetInnerHTML={{ __html: fullMatch }}
        />
      );
    }
  });
};

/**
 * 处理知乎条目内容，将 <img> 标签转换为 Ant Design 的 <Image> 组件，
 * 以提供更好的查看体验。
 * @param htmlString 条目的HTML内容。
 * @returns 包含解析后内容的React片段。
 */
export const parseZhihuItemContent = (htmlString: string | undefined) => {
  const regex = /<img[^>]*?src="([^"]+)"[^>]*?>/g;

  return parseHtmlString(htmlString, regex, (match) => {
    const [fullMatch, src] = match;
    
    // 为了可访问性，尝试从完整的img标签中提取alt文本
    const altRegex = /alt="([^"]*)"/;
    const altMatch = fullMatch.match(altRegex);
    const alt = altMatch ? altMatch[1] : "";

    return <Image key={`image-${match.index}`} src={src} alt={alt} />;
  });
};