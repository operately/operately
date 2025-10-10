import { useLoadedData } from "@/components/Pages";
import React from "react";
import { useParams } from "react-router-dom";
import { CacheManager } from "./CacheManager";

type PageLoaderFn<T> = (attrs: { params: any; request?: Request; refreshCache?: boolean }) => Promise<T>;

type FetchFn = () => Promise<any>;

interface FetchParams {
  cacheKey: string;
  fetchFn: FetchFn;
  maxAgeMs?: number;
  refreshCache: boolean;
}

const DEFAULT_MAX_AGE_MS = 1000 * 60 * 5; // 5 minutes

export const PageCache = {
  fetch: async function getOrSetCache(attrs: FetchParams): Promise<{ data: any; cacheVersion: number }> {
    const { cacheKey, fetchFn, maxAgeMs = DEFAULT_MAX_AGE_MS, refreshCache } = attrs;

    if (!refreshCache) {
      const cachedEntry = CacheManager.getItem(cacheKey);

      if (cachedEntry) {
        const { data, timestamp } = cachedEntry;
        if (Date.now() - timestamp < maxAgeMs) {
          return { data, cacheVersion: timestamp };
        }
      }
    }

    const data = await fetchFn();
    const cacheEntry = CacheManager.createCacheEntry(data);
    const success = CacheManager.setItem(cacheKey, JSON.stringify(cacheEntry));

    if (!success) {
      console.warn(`Failed to cache data for key "${cacheKey}" - localStorage quota may be full`);
    }

    return { data, cacheVersion: cacheEntry.timestamp };
  },

  useData: function <T>(
    loader: PageLoaderFn<T>,
    opts: { refreshCache?: boolean } = {},
  ): T & { refresh?: () => Promise<void> } {
    const params = useParams();
    const loadedData = useLoadedData<T>();

    const [data, setData] = React.useState<T>(loadedData);
    const paramsRef = React.useRef(params);
    opts = { refreshCache: true, ...opts };

    // Update ref when params change
    React.useEffect(() => {
      paramsRef.current = params;
    }, [params]);

    React.useEffect(() => {
      setData(loadedData);
    }, [loadedData]);

    // Use a stable key based on param values
    const paramsKey = React.useMemo(() => JSON.stringify(params), [params]);

    React.useEffect(() => {
      const abortController = new AbortController();

      loader({ params: paramsRef.current, refreshCache: opts.refreshCache }).then((newData) => {
        if (!abortController.signal.aborted) {
          setData(newData);
        }
      }).catch((error) => {
        // Silently ignore errors if the component was unmounted
        if (!abortController.signal.aborted) {
          console.error("PageCache loader error:", error);
        }
      });

      return () => {
        abortController.abort();
      };
    }, [paramsKey]);

    const refresh = React.useCallback(async () => {
      const newData = await loader({ params: paramsRef.current, refreshCache: true });
      setData(newData);
    }, [paramsKey, loader]);

    return { ...data, refresh };
  },

  invalidate: function invalidateCache(cacheKey: string): void {
    CacheManager.removeItem(cacheKey);
  },
};
