import React, { useEffect, useState } from 'react';
import { useRequest } from '../hooks/useRequest';
import { createXhsApi } from '../api';

export const FeedRequester: React.FC = () => {
  const { request } = useRequest();
  const api = createXhsApi(request as any);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getFeed().then((res) => {
      if (!mounted) return;
      setItems(res.items || []);
    }).catch((e) => {
      if (!mounted) return;
      setError(e.message);
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [api]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div style={{ color: 'red' }}>错误: {error}</div>;
  return <div>共 {items.length} 条</div>;
};

export default FeedRequester;
