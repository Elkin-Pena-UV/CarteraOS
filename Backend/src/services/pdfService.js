import { renderToBuffer } from '@react-pdf/renderer';
import { ReporteGeneral  } from '../templates/reporteGeneral.js';
import { ReporteCliente  } from '../templates/reporteCliente.js';
import { ReporteVariacion } from '../templates/reporteVariacion.js';
import { ReporteRotacion } from '../templates/reporteRotacion.js';
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

// ─────────────────────────────────────────────
// Generador del Reporte por Cliente
// ─────────────────────────────────────────────

export async function generateReporteCliente(payload) {
  const inicio = Date.now();

  const buffer = await renderToBuffer(
    React.createElement(ReporteCliente, payload)
  );

  logger.debug(
    `[PDF] Reporte cliente "${payload.cliente?.name ?? '?'}" generado en ${Date.now() - inicio}ms · ${buffer.length} bytes`
  );

  return buffer;
}

// ─────────────────────────────────────────────
// Generador del Reporte de Variación
// ─────────────────────────────────────────────

export async function generateReporteVariacion(payload) {
  const inicio = Date.now();

  const buffer = await renderToBuffer(
    React.createElement(ReporteVariacion, payload)
  );

  logger.debug(
    `[PDF] Reporte variación generado en ${Date.now() - inicio}ms · ${buffer.length} bytes`
  );

  return buffer;
}

// ─────────────────────────────────────────────
// Generador del Reporte de Rotación
// ─────────────────────────────────────────────

export async function generateReporteRotacion(payload) {
  const inicio = Date.now();
 
  const buffer = await renderToBuffer(
    React.createElement(ReporteRotacion, payload)
  );
 
  logger.debug(
    `[PDF] Reporte rotación generado en ${Date.now() - inicio}ms · ${buffer.length} bytes`
  );
 
  return buffer;
}