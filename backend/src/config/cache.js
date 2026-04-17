const cache = new Map();

/**
 * Basic in-memory cache for API results.
 */
module.exports = {
  get: (key) => {
    const entry = cache.get(key);
    if (!entry) return null;
    
    // Check TTL (default 5 minutes)
    if (Date.now() > entry.expiry) {
      cache.delete(key);
      return null;
    }
    return entry.value;
  },
  
  set: (key, value, ttlMs = 300000) => {
    cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  },
  
  delete: (key) => cache.delete(key),
  
  clear: () => cache.clear(),
  
  // Invalidate by prefix (e.g., 'areas')
  invalidate: (prefix) => {
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  }
};
