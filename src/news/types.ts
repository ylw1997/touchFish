/*
 * Unified News Model & Source Interfaces
 */

export type NewsSourceKey = 'v2ex' | 'nga' | 'chiphell' | 'ithome' | 'hupu' | 'zhihu' | 'weibo';

export interface NewsListItem {
  id: string;              // unique id (hash/url/id)
  title: string;
  url?: string;
  source: NewsSourceKey;
  createdAt?: number;      // timestamp if available
  hotScore?: number;       // ranking / hot index etc.
  excerpt?: string;        // short preview
  image?: string;          // first image if any
  tags?: string[];
  supportsDetail: boolean; // whether detail fetch is available
  raw?: any;               // original raw data for future use
}

export interface NewsSource {
  key: NewsSourceKey;
  supportsDetail: boolean;
  fetchList: (params?: any) => Promise<NewsListItem[]>;
  fetchDetail?: (idOrUrl: string) => Promise<string | undefined>;
  rateLimit?: { max: number; perMs: number }; // optional limiter contract
}
