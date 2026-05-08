import NodeCache from 'node-cache';
import logger from '../config/logger.js';

const cache = new NodeCache({
  stdTTL: 3600,        // 1 hora por defecto
  checkperiod: 600,    // limpieza cada 10 min
  useClones: false     // mejor performance
});

const cacheMiddleware = (ttl = 3600) => {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const cacheKey = req.originalUrl;
    const cached = cache.get(cacheKey);

    if (cached) {
      logger.debug(`✅ Cache HIT: ${cacheKey}`);
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode === 200) {
        cache.set(cacheKey, data, ttl);
        logger.debug(`💾 Cached: ${cacheKey}`);
      }
      return originalJson(data);
    };
    next();
  };
};

const invalidateCache = (pattern) => {
  const keys = cache.keys();
  let count = 0;
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.del(key);
      count++;
    }
  });
  logger.info(`🗑️  Invalidadas ${count} entradas: ${pattern}`);
  return count;
};

const getCacheStats = () => cache.getStats();
const clearCache = () => cache.flushAll();

export { cacheMiddleware, invalidateCache, clearCache, getCacheStats };