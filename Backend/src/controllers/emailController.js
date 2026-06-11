// Backend/src/controllers/emailController.js
//
// Recibe la solicitud de envío de reporte(s) por email,
// valida los campos mínimos y delega al emailService.

import { enviarReporteEmail } from '../services/emailService.js';
import logger from '../config/logger.js';

/**
 * POST /api/email/reporte
 *
 * Body esperado:
 * {
 *   destinatario: "grupo-clientes@empresa.com",
 *   asunto:       "Reporte de Cartera - Cliente XYZ",
 *   cuerpo:       "Texto personalizado (opcional)",
 *   reportes: [
 *     {
 *       tipo:    "cliente",          // 'cliente' | 'variacion' | 'rotacion' | 'general'
 *       payload: { ... },            // mismo payload que recibe el endpoint /api/export/*
 *       nombre:  "reporte_cliente_900123456_20250610.pdf"
 *     },
 *     ...
 *   ]
 * }
 */
export async function enviarReporte(req, res, next) {
  try {
    const { destinatario, asunto, cuerpo, reportes } = req.body;

    // ── Validaciones básicas ──────────────────────────────────────────────
    if (!destinatario || typeof destinatario !== 'string' || !destinatario.includes('@')) {
      return res.status(400).json({
        ok: false,
        message: 'El campo "destinatario" es requerido y debe ser un email válido.',
      });
    }

    if (!asunto || typeof asunto !== 'string' || !asunto.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'El campo "asunto" es requerido.',
      });
    }

    if (!Array.isArray(reportes) || reportes.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Debes incluir al menos un reporte en el array "reportes".',
      });
    }

    const tiposValidos = ['cliente', 'variacion', 'rotacion', 'general'];
    for (const r of reportes) {
      if (!tiposValidos.includes(r.tipo)) {
        return res.status(400).json({
          ok: false,
          message: `Tipo de reporte inválido: "${r.tipo}". Válidos: ${tiposValidos.join(', ')}.`,
        });
      }
      if (!r.payload || typeof r.payload !== 'object') {
        return res.status(400).json({
          ok: false,
          message: `El reporte de tipo "${r.tipo}" no tiene payload.`,
        });
      }
      if (!r.nombre || typeof r.nombre !== 'string') {
        return res.status(400).json({
          ok: false,
          message: `El reporte de tipo "${r.tipo}" no tiene nombre de archivo.`,
        });
      }
    }

    // ── Inyectar generadoPor desde el JWT (nunca del body) ───────────────
    const generadoPor = req.user?.nombre ?? 'CarteraOS';

    // ── Inyectar generadoPor en el meta de cada payload ──────────────────
      const reportesConMeta = reportes.map(r => ({
          ...r,
          descripcion: r.descripcion ?? r.nombre,
          payload: {
              ...r.payload,
              meta: {
                  ...r.payload.meta,
                  generadoPor,
              },
          },
      }));

    // ── Delegar al servicio ───────────────────────────────────────────────
    const resultado = await enviarReporteEmail({
      destinatario: destinatario.trim(),
      asunto:       asunto.trim(),
      cuerpo:       cuerpo ?? '',
      generadoPor,
      reportes:     reportesConMeta,
    });

    return res.status(200).json(resultado);

  } catch (err) {
    logger.error('[Email] Error al enviar reporte:', err.message);
    next(err);
  }
}