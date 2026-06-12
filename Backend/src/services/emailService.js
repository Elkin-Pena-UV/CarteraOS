// Backend/src/services/emailService.js
//
// Genera uno o más PDFs (reutilizando pdfService.js) y los envía
// como adjuntos por correo electrónico usando nodemailer + Gmail SMTP.
//
// Tipos de reporte soportados:
//   'cliente'   → generateReporteCliente
//   'variacion' → generateReporteVariacion
//   'rotacion'  → generateReporteRotacion
//   'general'   → generateReporteGeneral

import nodemailer from 'nodemailer';
import {
  generateReporteCliente,
  generateReporteVariacion,
  generateReporteRotacion,
  generateReporteGeneral,
} from './pdfService.js';
import logger from '../config/logger.js';

// ─────────────────────────────────────────────
// Transporter (se crea una sola vez)
// ─────────────────────────────────────────────

function crearTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      'Faltan variables de entorno EMAIL_USER y/o EMAIL_PASS. ' +
      'Agrégalas al .env del backend.'
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

// ─────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────

/**
 * Genera el buffer PDF y devuelve un objeto adjunto de nodemailer.
 * @param {'cliente'|'variacion'|'rotacion'|'general'} tipo
 * @param {Object} payload  - mismo payload que reciben los generateReporte*
 * @param {string} nombre   - nombre del archivo adjunto (con .pdf)
 * @param {string} descripcion - descripción del archivo adjunto
 */
async function generarAdjunto(tipo, payload, nombre, descripcion) {
  let buffer;

  switch (tipo) {
    case 'cliente':
      buffer = await generateReporteCliente(payload);
      break;
    case 'variacion':
      buffer = await generateReporteVariacion(payload);
      break;
    case 'rotacion':
      buffer = await generateReporteRotacion(payload);
      break;
    case 'general':
      buffer = await generateReporteGeneral(payload);
      break;
    default:
      throw new Error(`Tipo de reporte desconocido: "${tipo}"`);
  }

  return {
    filename: nombre,
    content:  buffer,
    contentType: 'application/pdf',
    descripcion: descripcion,
    fechaCorte:  payload?.meta?.fechaCorte ?? null,
  };
}

// ─────────────────────────────────────────────
// Función principal exportada
// ─────────────────────────────────────────────

/**
 * Genera los PDFs solicitados y los envía como adjuntos.
 *
 * @param {Object}   opts
 * @param {string}   opts.destinatario     - Dirección de email (o grupo de Gmail)
 * @param {string}   opts.asunto           - Asunto del correo
 * @param {string}   opts.cuerpo           - Texto plano del cuerpo (opcional)
 * @param {string}   opts.generadoPor      - Nombre del usuario (del JWT)
 * @param {Object[]} opts.reportes         - Array de reportes a adjuntar
 *   Cada elemento:
 *     { tipo: 'cliente'|'variacion'|'rotacion'|'general', payload: {...}, nombre: 'archivo.pdf', descripcion: 'Descripción del archivo' }
 *
 * @returns {Promise<{ ok: boolean, mensaje: string }>}
 */
function formatearFecha(fecha) {
  if (!fecha) return 'la fecha indicada'
  const clean = String(fecha).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
  const [y, m, d] = clean.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
  day:   'numeric',
  month: 'long',
  year:  'numeric',
})
}

export async function enviarReporteEmail({ destinatario, asunto, cuerpo, generadoPor, reportes }) {
  if (!destinatario) throw new Error('El destinatario es requerido.');
  if (!reportes?.length) throw new Error('Debes incluir al menos un reporte.');

  const inicio = Date.now();

  // ── 1. Generar todos los PDFs en paralelo ──────────────────────────────
  logger.info(`[Email] Generando ${reportes.length} PDF(s) para enviar a ${destinatario}...`);

  const adjuntos = await Promise.all(
    reportes.map(({ tipo, payload, nombre, descripcion }) => generarAdjunto(tipo, payload, nombre, descripcion ?? nombre))
  );

  // ── 2. Construir el cuerpo del correo ──────────────────────────────────
  const nombreEmpresa = 'CEMENTOS SAN MARCOS S.A.S';
  const descripcionReporte = (adjuntos[0]?.descripcion ?? 'cartera').toLowerCase()
  const fechaCorteTexto = formatearFecha(adjuntos[0]?.fechaCorte);
  const textoCuerpo = cuerpo?.trim() || [
  `Estimado(a) cliente,`,
  ``,
  `Este mensaje ha sido generado automáticamente por nuestro sistema de gestión de cartera.`,
  ``,
  `Adjunto encontrará el reporte de ${descripcionReporte} con corte al ${fechaCorteTexto}, generado desde nuestro sistema de información.`,
  ``,
  `Este documento forma parte del conjunto de reportes periódicos que remitimos para mantenerle informado sobre el estado de su cuenta y el comportamiento de la cartera.`,
  ``,
  `Si tiene alguna inquietud sobre la información reportada, comuníquese con nuestra área de cartera:`,
  ``,
  `  📧 cartera@cementossanmarcos.com`,
  `  📞 (57) 300 000 0000`,
  ``,
  `Este correo es de solo envío. Por favor no responda directamente a este mensaje.`,
  ``,
  `Atentamente,`,
  `${generadoPor}`,
  `${nombreEmpresa}`,
].join('\n')
  // ── 3. Enviar ──────────────────────────────────────────────────────────
  const transporter = crearTransporter();

  await transporter.sendMail({
    from:        `"${nombreEmpresa} — Cartera" <${process.env.EMAIL_USER}>`,
    to:          destinatario,
    subject:     asunto,
    text:        textoCuerpo,
    html:        `<p>${textoCuerpo.replace(/\n/g, '<br>')}</p>`,
    attachments: adjuntos.map(({ filename, content, contentType, descripcion }) => ({ filename, content, contentType, description: descripcion })),
    headers: {
    'X-Priority': '3',
    'X-Mailer':   'CarteraOS',
    },
  });


  const duracion = Date.now() - inicio;
  const nombresArchivos = adjuntos.map(a => a.filename).join(', ');

  logger.info(
    `[Email] Enviado a ${destinatario} en ${duracion}ms — Adjuntos: ${nombresArchivos} — Por: ${generadoPor}`
  );

  return {
    ok: true,
    mensaje: `Correo enviado correctamente a ${destinatario} con ${adjuntos.length} adjunto(s).`,
  };
}