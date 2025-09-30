/* Simple in-memory cache for news lists & details */

type CacheEntry<T> = { expires: number; value: T };

const cache = new Map<string, CacheEntry<any>>();

export function getCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return;
  }
  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs: number) {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}

export function delCache(key: string) {
  cache.delete(key);
}

export function clearNewsCache() {
  cache.clear();
}
