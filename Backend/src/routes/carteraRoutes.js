import express from 'express';
import { Router } from 'express';
import { obtenerCartera, refrescarCartera } from '../controllers/carteraController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Middleware dinámico que ajusta TTL según query param
const dynamicCache = (req, res, next) => {
  const { modo } = req.query;
  // Si es 'corte' (cierre del mes anterior), cachear 24h
  // Si es 'hoy', cachear 1h
  const ttl = modo === 'corte' ? 86400 : 3600;
  return cacheMiddleware(ttl)(req, res, next);
};

router.get('/', dynamicCache, obtenerCartera);
router.post('/refrescar', refrescarCartera);  // 🆕 sin cache

export default router;