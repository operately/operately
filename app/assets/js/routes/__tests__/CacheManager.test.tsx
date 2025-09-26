import { CacheManager } from "../CacheManager";

// Mock localStorage for testing
const mockStorage: { [key: string]: string } = {};
const mockLocalStorage = {
  getItem: jest.fn((key: string) => mockStorage[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    // Simulate quota exceeded error after certain number of items
    if (Object.keys(mockStorage).length >= 3 && key.startsWith("v")) {
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
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
  get length() {
    return Object.keys(mockStorage).length;
  },
  key: jest.fn((index: number) => Object.keys(mockStorage)[index] || null),
};

// @ts-ignore
global.localStorage = mockLocalStorage;

describe("CacheManager", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe("setItem", () => {
    it("should successfully store items when quota is not exceeded", () => {
      const result = CacheManager.setItem("test-key", "test-value");
      expect(result).toBe(true);
      expect(mockStorage["test-key"]).toBe("test-value");
    });

    it("should handle quota exceeded error by cleaning up old entries", () => {
      // Fill up storage to near quota
      mockStorage["v1-Page.old-1"] = JSON.stringify({
        data: "old data 1",
        timestamp: Date.now() - 10000, // 10 seconds ago
        lastAccessed: Date.now() - 10000,
      });
      mockStorage["v2-Page.old-2"] = JSON.stringify({
        data: "old data 2",
        timestamp: Date.now() - 5000, // 5 seconds ago
        lastAccessed: Date.now() - 5000,
      });
      mockStorage["v3-Page.old-3"] = JSON.stringify({
        data: "old data 3",
        timestamp: Date.now() - 1000, // 1 second ago
        lastAccessed: Date.now() - 1000,
      });

      // This should trigger quota exceeded, then cleanup, then succeed
      const result = CacheManager.setItem("v4-Page.new", "new data");
      expect(result).toBe(true);

      // Should have cleaned up at least one old entry
      expect(Object.keys(mockStorage).length).toBeLessThanOrEqual(3);
    });
  });

  describe("getItem", () => {
    it("should return null for non-existent items", () => {
      const result = CacheManager.getItem("non-existent");
      expect(result).toBeNull();
    });

    it("should return cache entry and update lastAccessed", () => {
      const originalTime = Date.now() - 1000;
      const cacheEntry = {
        data: "test data",
        timestamp: originalTime,
        lastAccessed: originalTime,
      };

      mockStorage["test-key"] = JSON.stringify(cacheEntry);

      const result = CacheManager.getItem("test-key");

      expect(result).toBeTruthy();
      expect(result!.data).toBe("test data");
      expect(result!.timestamp).toBe(originalTime);
      expect(result!.lastAccessed).toBeGreaterThan(originalTime);
    });

    it("should handle corrupted cache entries gracefully", () => {
      mockStorage["corrupted-key"] = "invalid json";

      const result = CacheManager.getItem("corrupted-key");
      expect(result).toBeNull();
    });
  });

  describe("createCacheEntry", () => {
    it("should create cache entry with proper structure", () => {
      const data = { test: "data" };
      const entry = CacheManager.createCacheEntry(data);

      expect(entry).toHaveProperty("data", data);
      expect(entry).toHaveProperty("timestamp");
      expect(entry).toHaveProperty("lastAccessed");
      expect(typeof entry.timestamp).toBe("number");
      expect(typeof entry.lastAccessed).toBe("number");
    });
  });

  describe("removeItem", () => {
    it("should remove items from localStorage", () => {
      mockStorage["test-key"] = "test-value";

      CacheManager.removeItem("test-key");

      expect(mockStorage["test-key"]).toBeUndefined();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("test-key");
    });
  });
});
