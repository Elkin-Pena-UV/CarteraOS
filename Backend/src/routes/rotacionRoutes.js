import express from 'express';
import { obtenerRotacion } from '../controllers/rotacionController.js';
import { cacheMiddleware } from '../middleware/cacheMiddleware.js';

const router = express.Router();

// TTL de 1h por defecto. Si fechaCorte es de un mes ya cerrado (no el actual),
// el dato es inmutable y podríamos subir el TTL, pero 1h es seguro y suficiente.
router.get('/', cacheMiddleware(3600), obtenerRotacion);

export default router;