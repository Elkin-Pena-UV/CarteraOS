import express from 'express';
import { obtenerCruceAut } from '../controllers/cruceAutController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// Vista estática — TTL 1h
router.get('/', cacheMiddleware(3600), obtenerCruceAut);

export default router;