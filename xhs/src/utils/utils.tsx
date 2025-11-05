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
    return new Date(timestamp).toLocaleString();
  } catch {
    return "";
  }
}