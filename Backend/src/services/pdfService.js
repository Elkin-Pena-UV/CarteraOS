import { renderToBuffer } from '@react-pdf/renderer';
import { ReporteGeneral } from '../templates/reporteGeneral.js';
import logger from '../config/logger.js';
import React from 'react';

// ─────────────────────────────────────────────
// Generador del Reporte General
// ─────────────────────────────────────────────

export async function generateReporteGeneral(payload) {
  const inicio = Date.now();

  const buffer = await renderToBuffer(
    React.createElement(ReporteGeneral, payload)
  );

  logger.debug(
    `[PDF] Reporte general generado en ${Date.now() - inicio}ms · ${buffer.length} bytes`
  );

  return buffer;
}