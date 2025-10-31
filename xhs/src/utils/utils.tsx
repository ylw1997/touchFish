/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-10-31 15:15:25
 * @LastEditTime: 2025-10-31 15:15:30
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\xhs\src\utils\utils.tsx
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
export function generateXB3TraceId(len = 16) {
  const chars = "abcdef0123456789";
  let x_b3_traceid = "";
  for (let i = 0; i < len; i++) {
    x_b3_traceid += chars[Math.floor(Math.random() * chars.length)];
  }
  return x_b3_traceid;
}