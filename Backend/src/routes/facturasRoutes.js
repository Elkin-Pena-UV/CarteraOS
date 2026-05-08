import { Router } from 'express';
import { obtenerFacturasCliente } from '../controllers/facturasController.js';

const router = Router();

router.get('/', obtenerFacturasCliente);

export default router;