import express from 'express';
import { obtenerCruceAut } from '../controllers/cruceAutController.js';
import { procesarCrucesCtrl } from '../controllers/cruceProcesarController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

router.get('/', cacheMiddleware(3600), obtenerCruceAut);   // vista (cacheada 1h)
router.post('/procesar', procesarCrucesCtrl);              // acción (sin cache)

export default router;