import express from 'express';
import requireAuth from '../middleware/auth.js';
import { generateReporteGeneral, generateReporteCliente, generateReporteVariacion, generateReporteRotacion } from '../services/pdfService.js';
import logger from '../config/logger.js';

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/export/general
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// POST /api/export/cliente
// ─────────────────────────────────────────────

router.post('/cliente', requireAuth, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      meta: {
        ...req.body.meta,
        generadoPor: req.user.nombre, // viene del JWT, no del frontend
      },
    };

    const buffer = await generateReporteCliente(payload);

    const nit    = payload.cliente?.nit   ?? 'cliente';
    const fecha  = payload.meta?.fechaCorte ?? 'sin-fecha';
    const nombre = `reporte_cliente_${nit}_${fecha}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

  } catch (err) {
    logger.error('[PDF] Error generando reporte cliente:', err);
    next(err);
  }
});

// ─────────────────────────────────────────────
// POST /api/export/variacion
// ─────────────────────────────────────────────
router.post('/variacion', requireAuth, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      meta: {
        ...req.body.meta,
        generadoPor: req.user.nombre,
      },
    };

    const buffer = await generateReporteVariacion(payload);

    const fecha  = payload.meta?.fechaCorte ?? 'sin-fecha';
    const nombre = `reporte_variacion_${fecha}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

  } catch (err) {
    logger.error('[PDF] Error generando reporte variación:', err);
    next(err);
  }
});

// ─────────────────────────────────────────────
// POST /api/export/rotacion
// ─────────────────────────────────────────────
router.post('/rotacion', requireAuth, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      meta: {
        ...req.body.meta,
        generadoPor: req.user.nombre,
      },
    };
 
    const buffer = await generateReporteRotacion(payload);
 
    const fecha  = payload.meta?.fechaCorte ?? 'sin-fecha';
    const filtros = payload.meta?.filtrosActivos ?? {};
 
    // Nombre descriptivo según filtros activos
    let sufijo = 'general';
    if (filtros.razonSocial)        sufijo = filtros.razonSocial.replace(/\s+/g, '_').toLowerCase().slice(0, 30);
    else if (filtros.canal?.length) sufijo = filtros.canal.join('-');
    else if (filtros.condPago?.length) sufijo = filtros.condPago.join('-').toLowerCase();
 
    const nombre = `reporte_rotacion_${sufijo}_${fecha}.pdf`;
 
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
 
  } catch (err) {
    logger.error('[PDF] Error generando reporte rotación:', err);
    next(err);
  }
});

export default router;