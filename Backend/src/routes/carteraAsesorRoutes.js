import express from 'express';
import {
  obtenerCarteraAsesor,
  refrescarCarteraAsesor,
  obtenerAsesores,
} from '../controllers/carteraAsesorController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// ⚠️ /asesores debe ir ANTES de / para que Express no lo confunda
router.get('/asesores', cacheMiddleware(3600), obtenerAsesores);
router.get('/',         cacheMiddleware(3600), obtenerCarteraAsesor);
router.post('/refrescar',                      refrescarCarteraAsesor);

export default router;