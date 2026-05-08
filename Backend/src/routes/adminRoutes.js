import express from 'express';
import { invalidateCache, clearCache, getCacheStats } from '../middleware/cacheMiddleware.js';
import { getCartera } from '../services/carteraService.js';
import logger from '../config/logger.js';

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


// 🆕 Diagnóstico de performance de queries
router.get('/diagnostico/cartera', async (req, res) => {
  try {
    const { modo = 'corte' } = req.query;

    logger.info('🔍 Iniciando diagnóstico de cartera...');
    const inicio = Date.now();

    const result = await getCartera(modo, null);

    const diagnostico = {
      ok: true,
      resumen: {
        tiempoTotal: `${Date.now() - inicio}ms`,
        registros: result.tiempos.registros,
        tiempoConexion: `${result.tiempos.conexion}ms`,
        tiempoQuery: `${result.tiempos.query}ms`,
      },
      recomendaciones: []
    };

    // 🆕 Recomendaciones automáticas según tiempos
    if (result.tiempos.conexion > 100) {
      diagnostico.recomendaciones.push(
        '⚠️ Conexión lenta — revisar connection pooling en db.js'
      );
    }
    if (result.tiempos.query > 1000) {
      diagnostico.recomendaciones.push(
        '🔴 Query muy lenta (+1s) — se necesitan índices en SQL Server'
      );
    } else if (result.tiempos.query > 500) {
      diagnostico.recomendaciones.push(
        '🟡 Query moderada (+500ms) — índices recomendados'
      );
    } else {
      diagnostico.recomendaciones.push(
        '✅ Query rápida — no se necesitan índices urgentes'
      );
    }

    res.json(diagnostico);

  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;