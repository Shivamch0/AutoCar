/**
 * High-performance In-Memory TTL Cache with eviction, hit/miss metrics, and pattern invalidation.
 */
export class TTLCache {
  constructor(defaultTTLSeconds = 60, maxItems = 1000) {
    this.defaultTTL = defaultTTLSeconds * 1000;
    this.maxItems = maxItems;
    this.store = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      invalidations: 0
    };
  }

  set(key, value, customTTLSeconds = null) {
    if (this.store.size >= this.maxItems) {
      // Evict oldest item
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
        this.metrics.evictions++;
      }
    }

    const ttl = customTTLSeconds !== null ? customTTLSeconds * 1000 : this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.store.set(key, {
      value,
      expiresAt,
      cachedAt: Date.now()
    });

    this.metrics.sets++;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.metrics.misses++;
      return null;
    }

    this.metrics.hits++;
    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  invalidate(key) {
    if (this.store.has(key)) {
      this.store.delete(key);
      this.metrics.invalidations++;
      return true;
    }
    return false;
  }

  invalidatePattern(prefix) {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    this.metrics.invalidations += count;
    return count;
  }

  clear() {
    const size = this.store.size;
    this.store.clear();
    this.metrics.invalidations += size;
  }

  getStats() {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;

    return {
      size: this.store.size,
      maxItems: this.maxItems,
      defaultTTLSeconds: this.defaultTTL / 1000,
      metrics: {
        ...this.metrics,
        totalRequests,
        hitRatePercent: Math.round(hitRate * 10) / 10
      }
    };
  }
}

export const regionalCache = new TTLCache(
  parseInt(process.env.CACHE_TTL_SECONDS || '60', 10),
  500
);

