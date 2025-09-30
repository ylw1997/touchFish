/*
 * @Author: YangLiwei 1280426581@qq.com
 * @Date: 2025-09-30 14:35:13
 * @LastEditTime: 2025-09-30 15:26:23
 * @LastEditors: YangLiwei 1280426581@qq.com
 * @FilePath: \touchfish\src\news\fetch.ts
 * Copyright (c) 2025 by YangLiwei, All Rights Reserved. 
 * @Description: 
 */
import { getNewsSource } from './sources';
import { NewsListItem } from './types';

// Always fetch fresh data (no caching)
export async function fetchNewsList(sourceKey: string, params?: any): Promise<NewsListItem[]> {
  const source = getNewsSource(sourceKey);
  if (!source) throw new Error(`Unknown news source: ${sourceKey}`);
  const data = await source.fetchList(params);
  // console.log('Fetching news from source:', sourceKey, 'with params:', params, 'Result count:', data);
  return data;
}

export async function fetchNewsDetail(sourceKey: string, idOrUrl: string): Promise<string | undefined> {
  const source = getNewsSource(sourceKey);
  if (!source) throw new Error(`Unknown news source: ${sourceKey}`);
  if (!source.supportsDetail || !source.fetchDetail) return undefined;
  const html = await source.fetchDetail(idOrUrl);
  return html;
}
