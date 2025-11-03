import { useLoadedData } from "@/components/Pages";
import { getLocalStorage, safeGetItem, safeRemoveItem, safeSetItem } from "@/utils/safeLocalStorage";
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

// Cache writes keep an index so we can evict deterministically later.
const DEFAULT_MAX_AGE_MS = 1000 * 60 * 5; // 5 minutes
const CACHE_INDEX_KEY = "PageCache:index";
const PAGE_CACHE_METADATA_FLAG = "__pageCache";
const MAX_WRITE_ATTEMPTS = 5;

export const PageCache = {
  fetch: async function getOrSetCache(attrs: FetchParams): Promise<{ data: any; cacheVersion: number }> {
    const { cacheKey, fetchFn, maxAgeMs = DEFAULT_MAX_AGE_MS, refreshCache } = attrs;
    const storage = getLocalStorage();

    const cached = safeGetItem(storage, cacheKey, "PageCache");

    if (cached && !refreshCache) {
      try {
        const { data, timestamp } = parseCachedValue(cached, cacheKey);

        if (Date.now() - timestamp < maxAgeMs) {
          return { data, cacheVersion: timestamp };
        }
      } catch (error) {
        console.error(error);

        if (storage) {
          safeRemoveCacheEntry(storage, cacheKey);
        }
      }
    }

    const data = await fetchFn();
    const timestamp = Date.now();

    if (storage) {
      safeSetCacheEntry(storage, cacheKey, { data, timestamp, [PAGE_CACHE_METADATA_FLAG]: true });
    }

    return { data, cacheVersion: timestamp };
  },

  useData: function <T>(
    loader: PageLoaderFn<T>,
    opts: { refreshCache?: boolean } = {},
  ): T & { refresh?: () => Promise<void> } {
    const params = useParams();
    const loadedData = useLoadedData<T>();

    const [data, setData] = React.useState<T>(loadedData);
    const refreshCache = opts.refreshCache ?? true;

    // Use a stable key based on param values
    const paramsKey = React.useMemo(() => JSON.stringify(params), [params]);

    React.useEffect(() => {
      const abortController = new AbortController();

      loader({ params, refreshCache }).then((newData) => {
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
    }, [paramsKey, loader, refreshCache]);

    // Keep a ref to params for the refresh callback to avoid recreating it on every param change
    const paramsRef = React.useRef(params);

    React.useEffect(() => {
      paramsRef.current = params;
    }, [params]);

    const refresh = React.useCallback(async () => {
      const newData = await loader({ params: paramsRef.current, refreshCache: true });
      setData(newData);
    }, [loader]);

    return { ...data, refresh };
  },

  invalidate: function invalidateCache(cacheKey: string): void {
    const storage = getLocalStorage();

    if (!storage) {
      return;
    }

    safeRemoveCacheEntry(storage, cacheKey);
  },
};

type CacheIndex = Record<string, number>;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  [PAGE_CACHE_METADATA_FLAG]?: true;
}

function readCacheIndex(storage: Storage): CacheIndex {
  // Corrupted or missing index entries are quietly rebuilt on demand.
  const raw = safeGetItem(storage, CACHE_INDEX_KEY, "PageCache");

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }

    const index: CacheIndex = {};

    Object.entries(parsed).forEach(([key, value]) => {
      if (typeof value === "number") {
        index[key] = value;
      }
    });

    return index;
  } catch {
    // Corrupted index data - remove it so we can rebuild.
    safeRemoveItem(storage, CACHE_INDEX_KEY, "PageCache");
    return {};
  }
}

function writeCacheIndex(storage: Storage, index: CacheIndex): void {
  const result = safeSetItem(storage, CACHE_INDEX_KEY, JSON.stringify(index), "PageCache");

  if (!result.success && result.quotaExceeded) {
    console.warn("PageCache: unable to persist cache index due to storage quota limits.");
  }
}

function removeFromCacheIndex(storage: Storage, cacheKey: string): void {
  // Removal is a best-effort cleanup; callers tolerate missing index entries.
  const index = readCacheIndex(storage);

  if (!(cacheKey in index)) {
    return;
  }

  delete index[cacheKey];
  writeCacheIndex(storage, index);
}

function findEvictionCandidate(storage: Storage, excludeKey: string): string | null {
  // Fall back to scanning storage when the index is incomplete or missing timestamps.
  let candidateKey: string | null = null;
  let candidateTimestamp = Number.POSITIVE_INFINITY;

  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);

    if (!key || key === excludeKey || key === CACHE_INDEX_KEY) {
      continue;
    }

    const raw = safeGetItem(storage, key, "PageCache");

    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw) as CacheEntry<unknown>;
      const isPageCacheEntry =
        parsed?.[PAGE_CACHE_METADATA_FLAG] === true ||
        (parsed && typeof parsed === "object" && "data" in parsed && typeof parsed.timestamp === "number");

      if (!isPageCacheEntry) {
        continue;
      }

      const timestamp = typeof parsed.timestamp === "number" ? parsed.timestamp : 0;

      if (!candidateKey || timestamp < candidateTimestamp) {
        candidateKey = key;
        candidateTimestamp = timestamp;
      }
    } catch {
      continue;
    }
  }

  return candidateKey;
}

function evictOldestEntry(storage: Storage, index: CacheIndex, excludeKey: string): boolean {
  // First try the index; if it is out of sync, inspect storage directly.
  const entries = Object.entries(index)
    .filter(([key]) => key !== excludeKey)
    .sort(([, a], [, b]) => a - b);

  if (entries.length > 0) {
    const oldestEntry = entries[0];

    if (!oldestEntry) {
      return false;
    }

    const [oldestKey] = oldestEntry;
    safeRemoveItem(storage, oldestKey, "PageCache");
    delete index[oldestKey];
    return true;
  }

  const fallbackKey = findEvictionCandidate(storage, excludeKey);

  if (fallbackKey) {
    safeRemoveItem(storage, fallbackKey, "PageCache");
    delete index[fallbackKey];
    return true;
  }

  return false;
}

function safeSetCacheEntry<T>(storage: Storage, cacheKey: string, payload: CacheEntry<T>): void {
  // Multiple attempts allow us to cascade evictions when quota errors are reported.
  const index = readCacheIndex(storage);
  const serialized = JSON.stringify(payload);

  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
    const result = safeSetItem(storage, cacheKey, serialized, "PageCache");

    if (result.success) {
      index[cacheKey] = payload.timestamp;
      writeCacheIndex(storage, index);
      return;
    }

    if (!result.quotaExceeded) {
      return;
    }

    const removed = evictOldestEntry(storage, index, cacheKey);

    if (!removed) {
      console.warn(
        `PageCache: localStorage quota exceeded when writing key "${cacheKey}". Cache entry will be skipped.`,
      );
      return;
    }
  }
}

function safeRemoveCacheEntry(storage: Storage, cacheKey: string): void {
  safeRemoveItem(storage, cacheKey, "PageCache");

  removeFromCacheIndex(storage, cacheKey);
}

function parseCachedValue<T>(raw: string, cacheKey: string): CacheEntry<T> {
  try {
    const parsed = JSON.parse(raw) as CacheEntry<T>;

    if (!parsed || typeof parsed !== "object" || typeof parsed.timestamp !== "number" || !("data" in parsed)) {
      throw new Error("Invalid cache entry shape");
    }

    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse cached data for key "${cacheKey}": ${error}`);
  }
}
