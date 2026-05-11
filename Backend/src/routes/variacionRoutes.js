import express from 'express';
import { obtenerVariacion } from '../controllers/variacionController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// TTL de 1h — dato del día puede cambiar
router.get('/', cacheMiddleware(3600), obtenerVariacion);

export default router;