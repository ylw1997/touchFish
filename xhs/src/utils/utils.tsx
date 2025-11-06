/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-31 15:15:25
 * @LastEditTime: 2025-11-05 10:30:00
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\utils\utils.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */

/**
 * 生成小红书请求所需的 x-b3-traceid
 */
export function generateXB3TraceId(len = 16) {
  const chars = "abcdef0123456789";
  let x_b3_traceid = "";
  for (let i = 0; i < len; i++) {
    x_b3_traceid += chars[Math.floor(Math.random() * chars.length)];
  }
  return x_b3_traceid;
}

/**
 * 通用防抖函数
 * @param fn 要执行的函数
 * @param wait 延迟时间(ms)
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  let timer: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/**
 * 通用节流函数
 * @param fn 要执行的函数
 * @param wait 间隔时间(ms)
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  let lastTime = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn(...args);
    }
  };
}

/**
 * 从小红书图片对象中提取最佳质量的URL
 * @param imageItem 图片对象
 * @returns 图片URL
 */
export function extractXhsImageUrl(imageItem: any): string {
  if (!imageItem) return "";
  
  // 优先使用 info_list 中的高质量图片
  if (Array.isArray(imageItem.info_list)) {
    const preferred = imageItem.info_list.find(
      (it: any) => /ND_PRV|WB_PRV/.test(it.image_scene)
    ) || imageItem.info_list.find(
      (it: any) => /ND_DFT|WB_DFT/.test(it.image_scene)
    );
    if (preferred?.url) return preferred.url;
  }
  
  // 降级使用其他字段
  return imageItem.url_default || imageItem.url_pre || imageItem.url || "";
}

/**
 * 格式化时间戳为本地时间字符串
 * @param timestamp 时间戳(毫秒)
 * @returns 格式化后的时间字符串
 */
export function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    // 相对时间显示
    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    // 超过7天显示具体日期
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    // 如果是今年,不显示年份
    if (year === now.getFullYear()) {
      return `${month}-${day} ${hour}:${minute}`;
    }
    return `${year}-${month}-${day} ${hour}:${minute}`;
  } catch {
    return "";
  }
}

/**
 * 格式化数字为易读形式
 * @param num 数字
 * @returns 格式化后的字符串 (如 1000 -> 1k, 1000000 -> 1m)
 */
export function formatCount(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num, 10) : num;
  if (isNaN(n)) return '0';
  if (n < 1000) return n.toString();
  if (n < 10000) return (n / 1000).toFixed(1) + 'k';
  if (n < 1000000) return (n / 10000).toFixed(1) + 'w';
  return (n / 1000000).toFixed(1) + 'm';
}

/**
 * 解析文本中的话题标签 #XXX#
 * @param text 原始文本
 * @returns 包含文本片段和话题标签的数组
 */
export function parseTopicTags(text: string): Array<{ type: 'text' | 'tag'; content: string }> {
  if (!text) return [];
  const result: Array<{ type: 'text' | 'tag'; content: string }> = [];
  const regex = /#([^#]+)#/g;
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    // 添加标签前的文本
    if (match.index > lastIndex) {
      result.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    // 添加标签,去除内容中的 [] 及其中的内容
    const tagContent = match[1].replace(/\[[^\]]*\]/g, '');
    if (tagContent.trim()) { // 只添加非空标签
      result.push({ type: 'tag', content: tagContent });
    }
    lastIndex = regex.lastIndex;
  }
  
  // 添加剩余文本
  if (lastIndex < text.length) {
    result.push({ type: 'text', content: text.substring(lastIndex) });
  }
  
  return result.length > 0 ? result : [{ type: 'text', content: text }];
}

/**
 * 从视频对象中提取播放URL
 * @param note 笔记对象
 * @returns 视频播放URL或null
 */
export function extractVideoUrl(note: any): string | null {
  const streams = note?.video?.media?.stream;
  if (!streams) return null;

  const candidates: any[] = [
    ...(Array.isArray(streams.h265) ? streams.h265 : []),
    ...(Array.isArray(streams.h264) ? streams.h264 : []),
    ...(Array.isArray(streams.h266) ? streams.h266 : []),
    ...(Array.isArray(streams.av1) ? streams.av1 : []),
  ];

  const first = candidates[0];
  if (!first) return null;

  return first.master_url || first.backup_urls?.[0] || null;
}