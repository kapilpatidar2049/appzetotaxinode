/**
 * Simple in-memory TTL cache (Laravel Cache::put / get parity for helpers).
 */
const store = new Map();

function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/** @param {number} [ttlMinutes] default 1440 like PHP */
function cachePut(key, value, ttlMinutes = 1440) {
  const ttlMs = ttlMinutes * 60 * 1000;
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function cacheForget(key) {
  store.delete(key);
}

function cacheFlush() {
  store.clear();
}

module.exports = { cacheGet, cachePut, cacheForget, cacheFlush };
