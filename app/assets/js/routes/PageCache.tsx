import { useLoadedData } from "@/components/Pages";
import React from "react";
import { useParams } from "react-router-dom";
type PageLoaderFn<T> = ({ params, refreshCache }) => Promise<T>;

export const PageCache = {
  fetch: async function getOrSetCache({
    cacheKey,
    fetchFn,
    maxAgeMs,
    refreshCache,
  }: {
    cacheKey: string;
    fetchFn: () => Promise<any>;
    maxAgeMs: number;
    refreshCache: boolean;
  }): Promise<any> {
    const cached = localStorage.getItem(cacheKey);

    if (cached && !refreshCache) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < maxAgeMs) {
          return data;
        }
      } catch (e) {
        throw new Error(`Failed to parse cached data for key "${cacheKey}": ${e}`);
      }
    }

    const data = await fetchFn();
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));

    return data;
  },
  useData: function <T>(loader: PageLoaderFn<T>): T {
    const params = useParams();
    const loadedData = useLoadedData<T>();

    const [data, setData] = React.useState<T>(loadedData);

    React.useEffect(() => {
      setData(loadedData);
    }, [loadedData]);

    React.useEffect(() => {
      const abortController = new AbortController();

      loader({ params, refreshCache: true }).then((newData) => {
        if (!abortController.signal.aborted) {
          setData(newData);
        }
      });

      return () => {
        abortController.abort();
      };
    }, [params]);

    return data;
  },
};
