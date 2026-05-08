import { Router } from 'express';
import { obtenerCartera } from '../controllers/carteraController.js';

const router = Router();

router.get('/', obtenerCartera);

export default router;