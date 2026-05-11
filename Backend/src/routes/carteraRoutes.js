import express from 'express';
import { obtenerCartera, refrescarCartera } from '../controllers/carteraController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

/**
 * TTL según modo:
 *   'hoy'   → 1h   (dato del día, puede cambiar)
 *   'corte' → 24h  (cierre del mes anterior, no cambia)
 *   'fecha' → 24h  (fecha histórica elegida, no cambia)
 */
const dynamicCache = (req, res, next) => {
  const { modo = 'hoy' } = req.query;
  const ttl = modo === 'hoy' ? 3600 : 86400;
  return cacheMiddleware(ttl)(req, res, next);
};

router.get('/', dynamicCache, obtenerCartera);
router.post('/refrescar', refrescarCartera); // sin cache

export default router;