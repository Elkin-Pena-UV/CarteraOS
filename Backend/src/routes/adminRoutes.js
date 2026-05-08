import express from 'express';
import { invalidateCache, clearCache, getCacheStats } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Estadísticas del cache
router.get('/cache/stats', (req, res) => {
  const stats = getCacheStats();
  const hitRate = stats.hits / (stats.hits + stats.misses) || 0;
  
  res.json({
    ok: true,
    stats: {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: `${(hitRate * 100).toFixed(2)}%`,
      keys: stats.keys,
      ksize: stats.ksize,
      vsize: stats.vsize
    }
  });
});

// Invalidar por patrón
router.post('/cache/invalidate', (req, res) => {
  const { pattern } = req.query;
  if (!pattern) {
    return res.status(400).json({ ok: false, message: 'Se requiere parámetro: pattern' });
  }
  const count = invalidateCache(pattern);
  res.json({ ok: true, invalidated: count });
});

// Limpiar todo
router.post('/cache/clear', (req, res) => {
  clearCache();
  res.json({ ok: true, message: 'Cache limpiado completamente' });
});

export default router;