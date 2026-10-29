import { Image } from "antd";
import React from "react";
import ImagePreviewToolbar from "../components/ImagePreviewToolbar";
import ZhihuVideo from "../components/ZhihuVideo";

const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];

const getAttrValue = (html: string, attr: string) => {
  const match = html.match(new RegExp(`${attr}="([^"]*)"`, "i"));
  return match ? match[1] : "";
};

const getPreviewToolbar = (imageUrl: string, imageIndex: number, fileNamePrefix: string) => ({
  toolbarRender: (
    _: React.ReactNode,
    {
      transform: { scale },
      actions: { onZoomOut, onZoomIn, onRotateLeft, onRotateRight },
    }: any,
  ) => (
    <ImagePreviewToolbar
      imageUrl={imageUrl}
      imageIndex={imageIndex}
      fileNamePrefix={fileNamePrefix}
      scale={scale}
      onRotateLeft={onRotateLeft}
      onRotateRight={onRotateRight}
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
    />
  ),
});

/**
 * 规范化知乎正文中的视频卡片与视频链接
 * 将 <a class="video-box" ...>、图片后紧随的视频链接或独立视频链接转换为统一的 <zhihu-video> 占位标签
 */
export const normalizeZhihuVideo = (html: string | undefined): string => {
  if (!html) return "";

  let result = html;

  // 1. 匹配 <a ... class="video-box" ...>...</a> 或任何带有 data-lens-id 的容器标签
  result = result.replace(
    /<(a|div)[^>]*?(?:class=["'][^"']*video-box[^"']*["']|data-lens-id=["'](\d+)["'])[^>]*?>([\s\S]*?)<\/\1>/gi,
    (match, _tag, lensIdAttr, innerContent) => {
      let videoId = lensIdAttr;
      if (!videoId) {
        const idMatch =
          match.match(/data-lens-id=["'](\d+)["']/i) ||
          match.match(/(?:video|zvideo)(?:\/|%2F)(\d+)/i);
        if (idMatch) videoId = idMatch[1];
      }
      if (!videoId) return match;

      let poster = "";
      const posterMatch = match.match(/data-poster=["']([^"']+)["']/i);
      if (posterMatch) {
        poster = posterMatch[1];
      } else {
        const imgMatch =
          innerContent.match(/data-original=["']([^"']+)["']/i) ||
          innerContent.match(/data-actualsrc=["']([^"']+)["']/i) ||
          innerContent.match(/src=["']([^"']+)["']/i);
        if (imgMatch) poster = imgMatch[1];
      }

      return `<zhihu-video data-lens-id="${videoId}" data-poster="${poster || ""}"></zhihu-video>`;
    },
  );

  // 2. 匹配紧挨着视频链接的 <img>（中间允许包裹在 </p><p>、<br> 或空格换行中）
  // 解决知乎正文将封面图与视频链接作为两个独立段落渲染导致“上面是图片，下面是链接”的问题
  const imgFollowedByVideoRegex =
    /(<img[^>]*?>)(?:[\s\S]{0,120}?)(<a[^>]*?href=["'][^"']*(?:video|zvideo)(?:\/|%2F)(\d+)[^"']*["'][^>]*?>[\s\S]*?<\/a>)/gi;
  result = result.replace(
    imgFollowedByVideoRegex,
    (_fullMatch, imgTag, _aTag, videoId) => {
      const poster =
        getAttrValue(imgTag, "data-original") ||
        getAttrValue(imgTag, "data-actualsrc") ||
        getAttrValue(imgTag, "src");
      return `<zhihu-video data-lens-id="${videoId}" data-poster="${poster || ""}"></zhihu-video>`;
    },
  );

  // 3. 匹配剩余的单个视频 <a> 链接
  result = result.replace(
    /<a[^>]*?href=["'][^"']*(?:video|zvideo)(?:\/|%2F)(\d+)[^"']*["'][^>]*?>([\s\S]*?)<\/a>/gi,
    (_match, videoId, innerContent) => {
      const imgMatch =
        innerContent.match(/data-original=["']([^"']+)["']/i) ||
        innerContent.match(/data-actualsrc=["']([^"']+)["']/i) ||
        innerContent.match(/src=["']([^"']+)["']/i);
      const poster = imgMatch ? imgMatch[1] : "";
      return `<zhihu-video data-lens-id="${videoId}" data-poster="${poster}"></zhihu-video>`;
    },
  );

  // 4. 匹配可能未被 <a> 包裹的裸露视频链接
  result = result.replace(
    /(?<!["'=])https?:\/\/(?:www\.)?zhihu\.com\/(?:video|zvideo)\/(\d+)/gi,
    (_match, videoId) => {
      return `<zhihu-video data-lens-id="${videoId}" data-poster=""></zhihu-video>`;
    },
  );

  return result;
};

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
  processMatch: (match: RegExpExecArray) => React.ReactNode,
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
        />,
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
      />,
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
  const regex = /<a\s+([^>]*?)href="([^"]+)"([^>]*?)>(.*?)<\/a>/g;

  return parseHtmlString(htmlString, regex, (match) => {
    const [fullMatch, attrsBefore, href, attrsAfter, text] = match;
    const allAttrs = attrsBefore + " " + attrsAfter;

    // 检查是否有 comment_img class 或链接指向图片
    const hasCommentImgClass =
      /class=["']?[^"']*comment_img[^"']*["']?/.test(allAttrs);
    const isImageUrl = imageExtensions.some((ext) =>
      href.toLowerCase().endsWith(ext),
    );

    if (hasCommentImgClass || isImageUrl) {
      return (
        <Image
          key={`image-${match.index}`}
          src={href}
          alt={text}
          preview={getPreviewToolbar(
            href,
            match.index ?? 0,
            "zhihu_comment",
          )}
        />
      );
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
 * 处理知乎条目内容，将知乎视频和 <img> 标签转换为对应的 React 组件，
 * 提供类似 X 模块的直接视频播放体验和更佳的图片查看体验。
 * @param htmlString 条目的HTML内容。
 * @returns 包含解析后内容的React片段。
 */
export const parseZhihuItemContent = (htmlString: string | undefined) => {
  if (!htmlString) return null;

  // 1. 过滤 noscript
  const filteredHtml = htmlString.replace(/<noscript>.*?<\/noscript>/g, "");

  // 2. 规范化知乎视频标签为统一的 <zhihu-video>
  const normalizedHtml = normalizeZhihuVideo(filteredHtml);

  // 3. 同时查找 <zhihu-video> 和 <img> 标签
  const regex =
    /(<zhihu-video[^>]*?>[\s\S]*?<\/zhihu-video>|<zhihu-video[^>]*?\/>|<img[^>]*?>)/gi;

  return parseHtmlString(normalizedHtml, regex, (match) => {
    const fullMatch = match[0];

    // 如果匹配到知乎视频
    if (fullMatch.startsWith("<zhihu-video")) {
      const videoId = getAttrValue(fullMatch, "data-lens-id");
      const poster = getAttrValue(fullMatch, "data-poster");
      return (
        <ZhihuVideo
          key={`video-${videoId || match.index}`}
          videoId={videoId}
          initialPoster={poster}
        />
      );
    }

    // 否则作为普通图片处理
    const src = getAttrValue(fullMatch, "src");
    const alt = getAttrValue(fullMatch, "alt");
    const imageUrl =
      getAttrValue(fullMatch, "data-original") ||
      getAttrValue(fullMatch, "data-actualsrc") ||
      src;

    return (
      <Image
        key={`image-${match.index}`}
        src={imageUrl}
        alt={alt}
        preview={getPreviewToolbar(
          imageUrl,
          match.index ?? 0,
          "zhihu_content",
        )}
      />
    );
  });
};
