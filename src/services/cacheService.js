let redisClient = null;
let redisAvailable = false;

try {
  const redis = require("redis");
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3000) },
  });
  redisClient.on("error", () => { redisAvailable = false; });
  redisClient.on("ready", () => { redisAvailable = true; });
  redisClient.connect().catch(() => { redisAvailable = false; });
} catch {
  redisAvailable = false;
}

const memoryCache = new Map();
const MEMORY_TTL = 60000;
const MAX_MEMORY_ITEMS = 10000;

const cleanMemory = () => {
  if (memoryCache.size > MAX_MEMORY_ITEMS) {
    const now = Date.now();
    for (const [key, val] of memoryCache) {
      if (val.expiresAt < now) memoryCache.delete(key);
    }
  }
};
setInterval(cleanMemory, 60000);

exports.get = async (key) => {
  if (redisAvailable) {
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch { }
  }
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  memoryCache.delete(key);
  return null;
};

exports.set = async (key, value, ttlMs = MEMORY_TTL) => {
  if (redisAvailable) {
    try {
      await redisClient.setEx(key, Math.ceil(ttlMs / 1000), JSON.stringify(value));
      return;
    } catch { }
  }
  if (memoryCache.size < MAX_MEMORY_ITEMS) {
    memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
};

exports.del = async (key) => {
  if (redisAvailable) {
    try { await redisClient.del(key); } catch { }
  }
  memoryCache.delete(key);
};

exports.delPattern = async (pattern) => {
  if (redisAvailable) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length) await redisClient.del(keys);
    } catch { }
  }
  const regex = new RegExp(pattern.replace("*", ".*"));
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) memoryCache.delete(key);
  }
};

exports.flush = async () => {
  if (redisAvailable) {
    try { await redisClient.flushAll(); } catch { }
  }
  memoryCache.clear();
};

exports.isRedisAvailable = () => redisAvailable;

exports.memoize = (fn, keyFn, ttlMs = MEMORY_TTL) => {
  return async (...args) => {
    const key = keyFn(...args);
    const cached = await exports.get(key);
    if (cached !== null) return cached;
    const result = await fn(...args);
    await exports.set(key, result, ttlMs);
    return result;
  };
};
