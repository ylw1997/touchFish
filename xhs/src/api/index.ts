import { messageHandler } from '../utils/messageHandler';

interface XhsFeedResponse { items: any[]; cursor?: string; has_more?: boolean; }

export async function fetchFeed(cursor: string){
  const res = await messageHandler.send('XHS_GETDATA', { cursor });
  return (res || {}) as XhsFeedResponse;
}
