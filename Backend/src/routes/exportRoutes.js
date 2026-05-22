import express from 'express';
import requireAuth from '../middleware/auth.js';
import { generateReporteGeneral } from '../services/pdfService.js';
import logger from '../config/logger.js';

const router = express.Router();

// POST /api/export/general
router.post('/general', requireAuth, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      meta: {
        ...req.body.meta,
        generadoPor: req.user.nombre, // viene del JWT, no del frontend
      },
    };

    const buffer = await generateReporteGeneral(payload);

    const fecha  = payload.meta?.fechaCorte ?? 'sin-fecha';
    const nombre = `reporte_cartera_general_${fecha}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

  } catch (err) {
    logger.error('[PDF] Error generando reporte general:', err);
    next(err);
  }
});

export default router;