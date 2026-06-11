// Backend/src/routes/emailRoutes.js
//
// Expone el endpoint para envío de reportes PDF por correo electrónico.
// Requiere autenticación JWT (requireAuth).

import express from 'express';
import requireAuth from '../middleware/auth.js';
import { enviarReporte } from '../controllers/emailController.js';

const router = express.Router();

// POST /api/email/reporte
// Genera los PDFs indicados y los envía como adjuntos al destinatario.
router.post('/reporte', requireAuth, enviarReporte);

export default router;