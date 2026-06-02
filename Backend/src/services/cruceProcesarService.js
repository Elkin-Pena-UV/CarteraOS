// Backend/src/services/cruceProcesarService.js
//
// Capa de orquestación del cruce automático. NO contiene lógica de cruce
// (esa vive en ./cruces/*, son funciones puras): este service hace el I/O,
// arma el resumen y persiste los planos.
//
//   getCruceAut()  ->  procesarLote()  ->  resumen + planos
//
// Estructura asumida:
//   services/cruceAutService.js        (ya existe — trae los datos)
//   services/cruceProcesarService.js   (este archivo)
//   services/cruces/index.js           (lógica pura)

import { getCruceAut } from './cruceAutService.js';
import { procesarLote, configCruceDefault } from '../cruces/index.js';
import logger from '../config/logger.js';
import fs from 'fs-extra';
import path from 'node:path';

/** @typedef {import('./cruces/config.js').ConfigCruce} ConfigCruce */

/**
 * Ejecuta el pipeline completo de cruces sobre los datos actuales de cruceAut.
 *
 * @param {Object} [opts]
 * @param {ConfigCruce} [opts.cfg]
 * @param {number} [opts.umbralConfianza=0.8]
 * @param {() => Promise<{data: Object[]}>} [opts.fetch]  Override de la fuente (inyectable para tests)
 * @returns {Promise<{resumen: Object, procesados: Object[], gruposManuales: Object[], revision: Object[]}>}
 */
export async function procesarCruces(opts = {}) {
  const { cfg = configCruceDefault, umbralConfianza = 0.8, fetch = getCruceAut } = opts;

  const { data } = await fetch();
  const { procesados, gruposManuales, revision } = procesarLote(data, { cfg, umbralConfianza });

  // Resumen agregado — esto es lo que revela la distribución real sobre el total
  const porCaso = {};
  for (const p of procesados) porCaso[p.caso] = (porCaso[p.caso] ?? 0) + 1;
  const porMotivo = {};
  for (const r of revision) porMotivo[r.motivo] = (porMotivo[r.motivo] ?? 0) + 1;

  const resumen = {
    totalFilas: data.length,
    autoCruzados: procesados.length,
    gruposManuales: gruposManuales.length,
    itemsRevision: revision.length,
    porCaso,
    porMotivo,
  };

  logger.debug(
    `[cruces] filas=${resumen.totalFilas} auto=${resumen.autoCruzados} ` +
      `manuales=${resumen.gruposManuales} revision=${resumen.itemsRevision}`
  );

  return { resumen, procesados, gruposManuales, revision };
}

/**
 * Escribe un plano por cada grupo procesado (un archivo = una Nota Interna),
 * en latin-1 para respetar el ancho fijo del importador Siesa.
 *
 * @param {Object[]} procesados  El array `procesados` de procesarCruces()
 * @param {string} dir           Carpeta destino
 * @returns {Promise<string[]>}  Rutas escritas
 */
export async function escribirPlanos(procesados, dir) {
  await fs.ensureDir(dir);
  const escritos = [];
  for (const p of procesados) {
    const nombre = `Imp-UnoEE-NI_${p.tercero.trim()}_${p.clave.tipo}${p.clave.valor}.txt`;
    const ruta = path.join(dir, nombre);
    await fs.writeFile(ruta, Buffer.from(p.plano, 'latin1'));
    escritos.push(ruta);
  }
  logger.debug(`[cruces] planos escritos: ${escritos.length} en ${dir}`);
  return escritos;
}