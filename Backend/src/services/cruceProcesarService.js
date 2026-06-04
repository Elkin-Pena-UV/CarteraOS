// Backend/src/services/cruceProcesarService.js
import axios from 'axios';
import { getCruceAut } from './cruceAutService.js';
import { procesarLote, configCruceDefault, aPayloadConector } from '../cruces/index.js';
import logger from '../config/logger.js';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const SIESA_SCHEMA = require('../cruces/conector.json');

/** @typedef {import('../cruces/config.js').ConfigCruce} ConfigCruce */

const SIESA_URL        = process.env.SIESA_API_URL        || 'http://192.168.20.30:8086/importar';
const SIESA_GENERAR_URL= process.env.SIESA_API_GENERAR_URL|| 'http://192.168.20.30:8086/generar-plano';
const SIESA_TOKEN      = process.env.SIESA_API_TOKEN      || '';

const defaultPoster = (url, data, config) => axios.post(url, data, config);

// ─────────────────────────────────────────────────────────────────────────────
// Función interna compartida por enviarAConector y generarPlanoConector
// ─────────────────────────────────────────────────────────────────────────────
async function llamarConector(procesados, opts = {}) {
  const {
    url    = SIESA_URL,
    token  = SIESA_TOKEN,
    poster = defaultPoster,
  } = opts;

  const resultados = [];

  for (const p of procesados) {
    const datos  = aPayloadConector(p.doc);
    const payload = { conector: SIESA_SCHEMA, datos };
    try {
      const response = await poster(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      });
      resultados.push({
        tercero: p.tercero,
        clave: p.clave,
        caso: p.caso,
        ok: true,
        status: response.status,
        respuesta: response.data,
      });
    } catch (err) {
      const status = err.response?.status;
      logger.error(
        `[cruces] ${url} error tercero=${p.tercero} → clave=${p.clave.tipo}${p.clave.valor} caso=${p.caso} mensaje=${p.respuesta.message} → ${status ?? err.message}`
      );
      resultados.push({
        tercero: p.tercero,
        clave: p.clave,
        caso: p.caso,
        ok: false,
        status,
        respuesta: err.response?.data,
        error: err.message,
      });
    }
  }

  return resultados;
}

// ─────────────────────────────────────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Genera el plano en Siesa para verificación sin importar.
 * Llama a /generar-plano con el mismo payload que /importar.
 * @param {Object[]} procesados
 * @param {Object}  [opts]  url / token / poster
 */
export const generarPlanoConector = (procesados, opts = {}) =>
  llamarConector(procesados, { url: SIESA_GENERAR_URL, ...opts });

/**
 * Envía los cruces a Siesa para importación definitiva.
 * @param {Object[]} procesados
 * @param {Object}  [opts]  url / token / poster
 */
export const enviarAConector = (procesados, opts = {}) =>
  llamarConector(procesados, { url: SIESA_URL, ...opts });

/**
 * Pipeline completo: trae datos, empareja, clasifica, genera planos y/o importa.
 *
 * @param {Object}  [opts]
 * @param {ConfigCruce} [opts.cfg]
 * @param {number}  [opts.umbralConfianza=0.8]
 * @param {boolean} [opts.generar=false]   → llama /generar-plano (verificación)
 * @param {boolean} [opts.enviar=false]    → llama /importar (importación definitiva)
 * @param {boolean} [opts.escribir=false]  → vuelca planos a disco
 * @param {Function}[opts.fetch]           Override inyectable para tests
 * @param {Function}[opts.poster]          Override del POST para tests
 */
export async function procesarCruces(opts = {}) {
  const {
    cfg = configCruceDefault,
    umbralConfianza = 0.8,
    generar       = false,
    enviar        = false,
    escribir      = false,
    muestraPorCaso= false,
    fetch         = getCruceAut,
    poster        = defaultPoster,
  } = opts;

  const { data } = await fetch();
  const { procesados, gruposManuales, revision } = procesarLote(data, { cfg, umbralConfianza });

  const porCaso   = {};
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

  // Muestra: un grupo por caso (para pruebas antes del envío definitivo)
  let muestra = procesados;
  if (muestraPorCaso) {
    const vistos = new Set();
    muestra = procesados.filter((p) => {
      if (vistos.has(p.caso)) return false;
      vistos.add(p.caso);
      return true;
    });
  }

  let resultadosPlano;
  if (generar) {
    resultadosPlano = await generarPlanoConector(muestra, { poster });
    const ok  = resultadosPlano.filter((r) => r.ok).length;
    const err = resultadosPlano.filter((r) => !r.ok).length;
    logger.debug(`[cruces] /generar-plano → ok=${ok} errores=${err}`);
  }

  let resultadosApi;
  if (enviar) {
    resultadosApi = await enviarAConector(muestra, { poster });
    const ok  = resultadosApi.filter((r) => r.ok).length;
    const err = resultadosApi.filter((r) => !r.ok).length;
    logger.debug(`[cruces] /importar → ok=${ok} errores=${err}`);
  }

  let escritos;
  if (escribir) {
    const dir = process.env.CRUCES_OUTPUT_DIR || './planos-cruces';
    escritos = await escribirPlanos(muestra, dir);
  }

  return {
    resumen,
    procesados,
    gruposManuales,
    revision,
    ...(resultadosPlano ? { resultadosPlano } : {}),
    ...(resultadosApi   ? { resultadosApi }   : {}),
    ...(escritos        ? { escritos }        : {}),
  };
}

/**
 * Escribe un plano por grupo en latin-1.
 * @param {Object[]} procesados
 * @param {string}   dir
 */
export async function escribirPlanos(procesados, dir) {
  // Después
  await mkdir(dir, { recursive: true });
  const escritos = [];
  for (const p of procesados) {
    const nombre = `Imp-UnoEE-NI_${p.tercero.trim()}_${p.clave.tipo}${p.clave.valor}.txt`;
    const ruta   = path.join(dir, nombre);
    await writeFile(ruta, Buffer.from(p.plano, 'latin1'));
    escritos.push(ruta);
  }
  logger.debug(`[cruces] planos escritos: ${escritos.length} en ${dir}`);
  return escritos;
}