import express from 'express';
import { obtenerRotacion } from '../controllers/rotacionController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// TTL 24h — serie de 12 periodos históricos
router.get('/', cacheMiddleware(86400), obtenerRotacion);

export default router;