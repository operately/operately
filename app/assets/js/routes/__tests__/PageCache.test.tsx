import { PageCache } from "../PageCache";
import { CacheManager } from "../CacheManager";

jest.mock("../CacheManager");
const mockedCacheManager = CacheManager as jest.Mocked<typeof CacheManager>;

describe('PageCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetch', () => {
    it('should return cached data when available and not expired', async () => {
      const cachedData = { test: 'data' };
      const timestamp = Date.now() - 1000; // 1 second ago
      
      mockedCacheManager.getItem.mockReturnValue({
        data: cachedData,
        timestamp,
        lastAccessed: timestamp,
      });

      const fetchFn = jest.fn();
      const result = await PageCache.fetch({
        cacheKey: 'test-key',
        fetchFn,
        maxAgeMs: 5000, // 5 seconds
        refreshCache: false,
      });

      expect(result.data).toEqual(cachedData);
      expect(result.cacheVersion).toBe(timestamp);
      expect(fetchFn).not.toHaveBeenCalled();
      expect(mockedCacheManager.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should fetch fresh data when cache is expired', async () => {
      const cachedData = { test: 'old data' };
      const freshData = { test: 'fresh data' };
      const oldTimestamp = Date.now() - 10000; // 10 seconds ago
      
      mockedCacheManager.getItem.mockReturnValue({
        data: cachedData,
        timestamp: oldTimestamp,
        lastAccessed: oldTimestamp,
      });

      mockedCacheManager.createCacheEntry.mockReturnValue({
        data: freshData,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
      });

      mockedCacheManager.setItem.mockReturnValue(true);

      const fetchFn = jest.fn().mockResolvedValue(freshData);
      
      const result = await PageCache.fetch({
        cacheKey: 'test-key',
        fetchFn,
        maxAgeMs: 5000, // 5 seconds
        refreshCache: false,
      });

      expect(result.data).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalled();
      expect(mockedCacheManager.setItem).toHaveBeenCalled();
    });

    it('should fetch fresh data when refreshCache is true', async () => {
      const freshData = { test: 'fresh data' };
      
      mockedCacheManager.createCacheEntry.mockReturnValue({
        data: freshData,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
      });

      mockedCacheManager.setItem.mockReturnValue(true);

      const fetchFn = jest.fn().mockResolvedValue(freshData);
      
      const result = await PageCache.fetch({
        cacheKey: 'test-key',
        fetchFn,
        refreshCache: true,
      });

      expect(result.data).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalled();
      expect(mockedCacheManager.getItem).not.toHaveBeenCalled();
    });

    it('should handle cache storage failures gracefully', async () => {
      const freshData = { test: 'fresh data' };
      
      mockedCacheManager.getItem.mockReturnValue(null);
      mockedCacheManager.createCacheEntry.mockReturnValue({
        data: freshData,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
      });

      // Simulate storage failure (quota exceeded)
      mockedCacheManager.setItem.mockReturnValue(false);

      const fetchFn = jest.fn().mockResolvedValue(freshData);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = await PageCache.fetch({
        cacheKey: 'test-key',
        fetchFn,
        refreshCache: false,
      });

      expect(result.data).toEqual(freshData);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to cache data for key "test-key" - localStorage quota may be full'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('invalidate', () => {
    it('should remove cache entry using CacheManager', () => {
      PageCache.invalidate('test-key');
      expect(mockedCacheManager.removeItem).toHaveBeenCalledWith('test-key');
    });
  });
});