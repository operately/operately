import { PageCache } from "../PageCache";
import { CacheManager } from "../CacheManager";

// Integration test to verify the complete cache rotation system
describe("Cache Rotation Integration", () => {
  let originalLocalStorage: Storage;
  let mockStorage: { [key: string]: string } = {};

  beforeEach(() => {
    // Store original localStorage
    originalLocalStorage = global.localStorage;

    // Clear mock storage
    mockStorage = {};

    // Mock localStorage with quota simulation
    Object.defineProperty(global, "localStorage", {
      value: {
        getItem: jest.fn((key: string) => mockStorage[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          // Simulate quota exceeded after 5 cache entries
          const cacheKeys = Object.keys(mockStorage).filter((k) => k.indexOf("v") === 0 || k.indexOf("-Page.") !== -1);
          if (cacheKeys.length >= 5 && (key.indexOf("v") === 0 || key.indexOf("-Page.") !== -1)) {
            const error = new DOMException("QuotaExceededError");
            error.name = "QuotaExceededError";
            error.code = 22;
            throw error;
          }
          mockStorage[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: jest.fn(() => {
          mockStorage = {};
        }),
        get length() {
          return Object.keys(mockStorage).length;
        },
        key: jest.fn((index: number) => Object.keys(mockStorage)[index] || null),
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Restore original localStorage
    global.localStorage = originalLocalStorage;
  });

  it("should handle cache rotation when localStorage quota is exceeded", async () => {
    // Fill up storage with old cache entries
    const oldEntries = [];
    for (let i = 1; i <= 5; i++) {
      const entry = CacheManager.createCacheEntry({ data: `old-${i}`, id: i });
      entry.lastAccessed = Date.now() - i * 10000; // Make entries increasingly older
      const key = `v${i}-OldPage.page-${i}`;
      mockStorage[key] = JSON.stringify(entry);
      oldEntries.push(key);
    }

    expect(Object.keys(mockStorage).length).toBe(5);

    // Mock fetch function
    const mockFetchFn = jest.fn().mockResolvedValue({ newData: "test", id: "new" });

    // This should trigger quota exceeded and cause cleanup
    const result = await PageCache.fetch({
      cacheKey: "v6-NewPage.page-new",
      fetchFn: mockFetchFn,
      refreshCache: false,
    });

    // Should have successfully fetched new data
    expect(result.data).toEqual({ newData: "test", id: "new" });
    expect(mockFetchFn).toHaveBeenCalled();

    // Storage should have been cleaned up and new entry added
    expect(Object.keys(mockStorage).length).toBeLessThanOrEqual(5);

    // At least some old entries should have been removed
    const remainingOldEntries = oldEntries.filter((key) => mockStorage[key]);
    expect(remainingOldEntries.length).toBeLessThan(5);

    // New entry should be present
    const newEntryExists = Object.keys(mockStorage).some((key) => key.includes("v6-NewPage.page-new"));
    expect(newEntryExists).toBe(true);
  });

  it("should prefer to keep recently accessed cache entries", async () => {
    // Add cache entries with different access times
    const entries = [
      { key: "v1-Page.old", lastAccessed: Date.now() - 10000 }, // Oldest
      { key: "v2-Page.medium", lastAccessed: Date.now() - 5000 }, // Medium
      { key: "v3-Page.recent", lastAccessed: Date.now() - 1000 }, // Most recent
    ];

    entries.forEach(({ key, lastAccessed }) => {
      const entry = CacheManager.createCacheEntry({ data: key });
      entry.lastAccessed = lastAccessed;
      mockStorage[key] = JSON.stringify(entry);
    });

    // Fill up remaining slots
    mockStorage["v4-Page.fill1"] = JSON.stringify(CacheManager.createCacheEntry({ data: "fill1" }));
    mockStorage["v5-Page.fill2"] = JSON.stringify(CacheManager.createCacheEntry({ data: "fill2" }));

    const mockFetchFn = jest.fn().mockResolvedValue({ data: "newest" });

    // This should trigger cleanup
    await PageCache.fetch({
      cacheKey: "v6-Page.newest",
      fetchFn: mockFetchFn,
      refreshCache: false,
    });

    // The oldest entry should be removed first
    expect(mockStorage["v1-Page.old"]).toBeUndefined();

    // The most recent entry should be preserved
    expect(mockStorage["v3-Page.recent"]).toBeDefined();
  });

  it("should gracefully handle persistent storage failures", async () => {
    // Make localStorage always fail
    Object.defineProperty(global, "localStorage", {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(() => {
          throw new DOMException("QuotaExceededError");
        }),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn(() => null),
      },
      writable: true,
    });

    const mockFetchFn = jest.fn().mockResolvedValue({ data: "test" });

    // Should still work even if caching fails
    const result = await PageCache.fetch({
      cacheKey: "v1-Page.test",
      fetchFn: mockFetchFn,
      refreshCache: false,
    });

    expect(result.data).toEqual({ data: "test" });
    expect(mockFetchFn).toHaveBeenCalled();
  });
});
