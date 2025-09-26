// Cache management utilities for localStorage to prevent quota exceeded errors
interface CacheEntry {
  data: any;
  timestamp: number;
  lastAccessed: number;
}

const CACHE_KEY_PREFIX = 'operately-cache-';
const MAX_STORAGE_PERCENTAGE = 0.8; // Use max 80% of localStorage quota
const CLEANUP_PERCENTAGE = 0.6; // Clean up to 60% when limit is exceeded

export class CacheManager {
  /**
   * Estimates the size of a value when stored as JSON in localStorage
   */
  private static estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // UTF-16 characters are 2 bytes
    } catch {
      return 0;
    }
  }

  /**
   * Gets the approximate localStorage usage in bytes
   */
  private static getCurrentStorageSize(): number {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          total += (key.length + value.length) * 2; // UTF-16
        }
      }
    }
    return total;
  }

  /**
   * Estimates localStorage quota (varies by browser, usually 5-10MB)
   */
  private static estimateQuota(): number {
    // Most browsers have 5-10MB localStorage quota
    // We'll use a conservative 5MB estimate
    return 5 * 1024 * 1024; // 5MB in bytes
  }

  /**
   * Gets all cache entries sorted by last accessed time (oldest first)
   */
  private static getCacheEntries(): Array<{ key: string; entry: CacheEntry }> {
    const entries: Array<{ key: string; entry: CacheEntry }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && this.isCacheKey(key)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const entry: CacheEntry = JSON.parse(value);
            entries.push({ key, entry });
          }
        } catch {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
        }
      }
    }

    // Sort by lastAccessed (oldest first)
    return entries.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);
  }

  /**
   * Checks if a localStorage key is a cache key
   */
  private static isCacheKey(key: string): boolean {
    return key.includes('-Page.') || key.startsWith('v');
  }

  /**
   * Removes old cache entries to free up space
   */
  private static cleanupOldEntries(): void {
    const quota = this.estimateQuota();
    const targetSize = quota * CLEANUP_PERCENTAGE;
    const entries = this.getCacheEntries();
    
    let currentSize = this.getCurrentStorageSize();
    
    // Remove oldest entries until we're under the target size
    for (const { key } of entries) {
      if (currentSize <= targetSize) {
        break;
      }
      
      const value = localStorage.getItem(key);
      if (value) {
        const entrySize = (key.length + value.length) * 2;
        localStorage.removeItem(key);
        currentSize -= entrySize;
      }
    }
  }

  /**
   * Safely sets an item in localStorage with quota management
   */
  static setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      // Check if it's a quota exceeded error
      if (error instanceof DOMException && (
        error.code === 22 || // QUOTA_EXCEEDED_ERR
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        // Clean up old entries and try again
        this.cleanupOldEntries();
        
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (secondError) {
          console.warn('Failed to store cache entry after cleanup:', secondError);
          return false;
        }
      }
      
      console.warn('Failed to store cache entry:', error);
      return false;
    }
  }

  /**
   * Gets an item from localStorage and updates its access time
   */
  static getItem(key: string): CacheEntry | null {
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      
      const entry: CacheEntry = JSON.parse(value);
      
      // Update last accessed time
      entry.lastAccessed = Date.now();
      
      // Store back with updated access time
      const updatedValue = JSON.stringify(entry);
      this.setItem(key, updatedValue);
      
      return entry;
    } catch {
      return null;
    }
  }

  /**
   * Removes an item from localStorage
   */
  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Creates a cache entry with proper metadata
   */
  static createCacheEntry(data: any): CacheEntry {
    const now = Date.now();
    return {
      data,
      timestamp: now,
      lastAccessed: now,
    };
  }

  /**
   * Checks if storage usage is approaching quota
   */
  static isStorageNearQuota(): boolean {
    const currentSize = this.getCurrentStorageSize();
    const quota = this.estimateQuota();
    return currentSize > (quota * MAX_STORAGE_PERCENTAGE);
  }
}