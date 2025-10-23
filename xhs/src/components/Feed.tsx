import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchFeed } from '../api';
import { messageHandler } from '../utils/messageHandler';

interface FeedItem { id: string; raw: any; }
interface FeedProps { showImg: boolean; }

export default function Feed({ showImg }: FeedProps){
  const [items,setItems] = useState<FeedItem[]>([]);
  const [cursor,setCursor] = useState<string>('');
  const [hasMore,setHasMore] = useState<boolean>(true);
  const [loading,setLoading] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement|null>(null);

  const load = useCallback(async ()=>{
    if(loading || !hasMore) return;
    setLoading(true);
    try {
      const data = await fetchFeed(cursor);
      setItems(prev => {
        const mapped = data.items.map((raw: any) => ({ id: raw.note_id || Math.random().toString(36).slice(2), raw }));
        return cursor ? [...prev, ...mapped] : mapped;
      });
      setCursor(data.cursor || '');
      setHasMore(!!data.has_more);
    } catch (e:any){
      console.error('[xhs feed error]', e?.message || e);
    } finally {
      setLoading(false);
    }
  },[cursor,loading,hasMore]);

  useEffect(()=>{ load(); },[load]);

  useEffect(()=>{
    const el = listRef.current;
    if(!el) return;
    const onScroll = () => {
      const bottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 30;
      if(bottom) load();
      // 保存滚动位置
      messageHandler.send('XHS_SAVE_SCROLL_POSITION', el.scrollTop);
    };
    el.addEventListener('scroll', onScroll);
    return ()=> el.removeEventListener('scroll', onScroll);
  },[load]);

  return <div ref={listRef} style={{height:'100%', overflow:'auto'}}>
    {items.map(it=> {
      const display = { ...it.raw };
      if(!showImg && display?.images) {
        // 隐藏图片数组，仅展示数量
        display.images_count = Array.isArray(display.images) ? display.images.length : 0;
        delete display.images;
      }
      return <pre key={it.id} style={{fontSize:11, lineHeight: '16px', whiteSpace:'pre-wrap', wordBreak:'break-word'}}>{JSON.stringify(display, null, 2)}</pre>;
    })}
    <div style={{padding:8, textAlign:'center', color:'#999'}}>{loading? '加载中...' : hasMore? '滚动加载更多' : '已到底部'}</div>
  </div>;
}
