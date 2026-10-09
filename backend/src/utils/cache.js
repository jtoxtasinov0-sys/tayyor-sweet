// Oddiy xotiradagi kesh (TTL bilan). Admin o'zgartirsa — tozalanadi.
const store = new Map();

function get(key) {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (hit.exp < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

function set(key, value, ttlMs = 60_000) {
  store.set(key, { value, exp: Date.now() + ttlMs });
  return value;
}

async function wrap(key, ttlMs, fn) {
  const hit = get(key);
  if (hit !== undefined) return hit;
  return set(key, await fn(), ttlMs);
}

function clear() {
  store.clear();
}

module.exports = { get, set, wrap, clear };
