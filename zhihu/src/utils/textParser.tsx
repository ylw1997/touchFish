/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-08-07 10:39:19
 * @LastEditTime: 2025-09-10 09:29:23
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\zhihu\src\utils\textParser.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
import { Image } from "antd";
import React from "react";

export const processCommentContent = (htmlString: string | undefined) => {
  if (!htmlString) {
    return null;
  }
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
  const regex = /<a.*?href="(.*?)".*?>(.*?)<\/a>/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(htmlString)) !== null) {
    // Push the text before the link
    if (match.index > lastIndex) {
      elements.push(
        <span
          key={`text-${lastIndex}`}
          dangerouslySetInnerHTML={{
            __html: htmlString.substring(lastIndex, match.index),
          }}
        />
      );
    }

    const href = match[1];
    const text = match[2];
    const isImage = imageExtensions.some((ext) =>
      href.toLowerCase().endsWith(ext)
    );

    if (isImage) {
      elements.push(<Image key={`image-${match.index}`} src={href} alt={text} />);
    } else {
      // Not an image link, keep it as a link.
      elements.push(
        <span
          key={`link-${match.index}`}
          dangerouslySetInnerHTML={{ __html: match[0] }}
        />
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Push the remaining text after the last link
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

export const parseZhihuItemContent = (htmlString: string | undefined) => {
  if (!htmlString) {
    return null;
  }
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
  const regex = /<img.*?src="(.*?)".*?>(.*?)>/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(htmlString)) !== null) {
    // Push the text before the link
    if (match.index > lastIndex) {
      elements.push(
        <span
          key={`text-${lastIndex}`}
          dangerouslySetInnerHTML={{
            __html: htmlString.substring(lastIndex, match.index),
          }}
        />
      );
    }

    const href = match[1];
    const text = match[2];
    const isImage = imageExtensions.some((ext) =>
      href.toLowerCase().endsWith(ext)
    );

    if (isImage) {
      elements.push(<Image key={`image-${match.index}`} src={href} alt={text} />);
    } else {
      // Not an image link, keep it as a link.
      elements.push(
        <span
          key={`link-${match.index}`}
          dangerouslySetInnerHTML={{ __html: match[0] }}
        />
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Push the remaining text after the last link
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

export const a = 1;