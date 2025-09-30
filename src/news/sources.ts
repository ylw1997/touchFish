/* Registry of all news sources */
import { NewsSource, NewsListItem } from './types';
import { getV2exList, getV2exDetail } from '../api/v2ex';
import { getChipHellNews, getChipHellNewsDetail } from '../api/chipHell';
import { getNgaList, getNgaNewsDetail } from '../api/nga';
import { getNewsList as getIthomeList, getNewsDetail as getIthomeDetail } from '../api/ithome';
import { getHupuList, getHupuDetail } from '../api/hupu';
// Zhihu / Weibo can be integrated later (they have more complex flows)

function normalizeList(items: { title: string; url: string }[], source: NewsSource['key']): NewsListItem[] {
  return items.map((item) => ({
    id: `${source}:${item.url}`,
    title: item.title.trim(),
    url: item.url.startsWith('http') ? item.url : item.url,
    source,
    supportsDetail: true,
  }));
}

export const newsSources: NewsSource[] = [
  {
    key: 'v2ex',
    supportsDetail: true,
    fetchList: async (params?: { tab?: string }) => normalizeList(await getV2exList(params?.tab || 'all'), 'v2ex'),
    fetchDetail: async (url) => {
      const html = await getV2exDetail(url.replace('https://www.v2ex.com',''));
      return html || undefined;
    },
  },
  {
    key: 'chiphell',
    supportsDetail: true,
    fetchList: async () => normalizeList(await getChipHellNews(), 'chiphell'),
    fetchDetail: getChipHellNewsDetail,
  },
  {
    key: 'nga',
    supportsDetail: true,
    fetchList: async (params?: { tab?: string }) => normalizeList((await getNgaList(params?.tab)) || [], 'nga'),
    fetchDetail: async (url) => {
      const html = await getNgaNewsDetail(url);
      return html || undefined;
    },
  },
  {
    key: 'ithome',
    supportsDetail: true,
    fetchList: async () => {
      const res = await getIthomeList();
      // itHome 返回结构: axios response -> data.newslist ? 未严格定义
      const list = res.data?.newslist || res.data || [];
      return normalizeList(list.map((n: any) => ({ title: n.title, url: n.newsid+'' })), 'ithome');
    },
    fetchDetail: async (id) => {
      const res = await getIthomeDetail(Number(id));
      return JSON.stringify(res.data);
    },
  },
  {
    key: 'hupu',
    supportsDetail: true,
    fetchList: async (params?: { tab?: string }) => normalizeList(await getHupuList(params?.tab || 'all-gambia'), 'hupu'),
    fetchDetail: async (url) => {
      const html = await getHupuDetail(url);
      return html || undefined;
    }
  },
];

export function getNewsSource(key: string) {
  return newsSources.find(s => s.key === key);
}
