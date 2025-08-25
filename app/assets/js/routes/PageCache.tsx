import { useLoadedData } from "@/components/Pages";
import React from "react";
import { useParams } from "react-router-dom";

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
    const cached = localStorage.getItem(cacheKey);

    if (cached && !refreshCache) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < maxAgeMs) {
          return { data, cacheVersion: timestamp };
        }
      } catch (e) {
        throw new Error(`Failed to parse cached data for key "${cacheKey}": ${e}`);
      }
    }

    const data = await fetchFn();
    const timestamp = Date.now();
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: timestamp }));

    return { data, cacheVersion: timestamp };
  },

  useData: function <T>(loader: PageLoaderFn<T>, opts: { refreshCache?: boolean } = {}): [T, () => Promise<void>] {
    const params = useParams();
    const loadedData = useLoadedData<T>();

    const [data, setData] = React.useState<T>(loadedData);
    opts = { refreshCache: true, ...opts };

    React.useEffect(() => {
      setData(loadedData);
    }, [loadedData]);

    React.useEffect(() => {
      const abortController = new AbortController();

      loader({ params, refreshCache: opts.refreshCache }).then((newData) => {
        if (!abortController.signal.aborted) {
          setData(newData);
        }
      });

      return () => {
        abortController.abort();
      };
    }, [params]);

    const refresh = React.useCallback(async () => {
      const newData = await loader({ params, refreshCache: true });
      setData(newData);
    }, [params, loader]);

    return [data, refresh];
  },

  invalidate: function invalidateCache(cacheKey: string): void {
    localStorage.removeItem(cacheKey);
  },
};
