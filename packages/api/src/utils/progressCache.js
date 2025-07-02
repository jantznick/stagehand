/**
 * In-memory cache for ZAP scan progress responses
 * Reduces load on ZAP API by caching responses for short periods
 */

class ProgressCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 3000; // 3 seconds in milliseconds
  }

  /**
   * Get cached progress data if valid
   * @param {string} scanId - The scan ID
   * @returns {object|null} - Cached data or null if expired/missing
   */
  get(scanId) {
    const entry = this.cache.get(scanId);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(scanId);
      return null;
    }

    return entry.data;
  }

  /**
   * Store progress data in cache
   * @param {string} scanId - The scan ID
   * @param {object} data - Progress data to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(scanId, data, ttl = null) {
    this.cache.set(scanId, {
      data: data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Remove entry from cache
   * @param {string} scanId - The scan ID
   */
  delete(scanId) {
    this.cache.delete(scanId);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Remove expired entries (cleanup)
   */
  cleanup() {
    const now = Date.now();
    for (const [scanId, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(scanId);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const progressCache = new ProgressCache();

// Cleanup expired entries every 30 seconds
setInterval(() => {
  progressCache.cleanup();
}, 30000); 