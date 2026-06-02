// Backend/src/services/cruces/index.js
//
// Barrel + pipeline de conveniencia del módulo de cruce automático.
//
// Flujo completo:
//   filas crudas (cruceAut)
//     -> normalizar()         una por fila
//     -> emparejar()          agrupa por tercero + mejor llave común (PVC/OC)
//     -> clasificar()         determina el caso por grupo
//     -> mapearADocumento()   arma el DocumentoCruce
//     -> generarPlanoCruce()  produce el archivo plano Siesa

export { normalizar, clavesDesdeNotas, clavesDesdeFVE } from './normalizador.js';
export { emparejar } from './matcher.js';
export { clasificar } from './clasificador.js';
export { mapearADocumento } from './mapper.js';
export { generarPlanoCruce } from './siesaPlano.js';
export { configCruceDefault } from './config.js';

import { normalizar } from './normalizador.js';
import { emparejar } from './matcher.js';
import { clasificar } from './clasificador.js';
import { mapearADocumento } from './mapper.js';
import { generarPlanoCruce } from './siesaPlano.js';
import { configCruceDefault } from './config.js';

/** @typedef {import('./normalizador.js').DocNormalizado} DocNormalizado */
/** @typedef {import('./normalizador.js').Clave} Clave */
/** @typedef {import('./config.js').ConfigCruce} ConfigCruce */

/**
 * Procesa un grupo YA emparejado (mismo tercero + misma llave) de punta a punta.
 * @param {DocNormalizado[]} grupo
 * @param {Clave} clave             Llave con la que se emparejó
 * @param {string} fechaDoc         "AAAAMMDD" (fecha de la factura)
 * @param {ConfigCruce} [cfg]
 * @returns {{ caso: string, net: number, doc: object, plano: string }}
 */
export function procesarGrupo(grupo, clave, fechaDoc, cfg = configCruceDefault) {
  const { caso, net } = clasificar(grupo, cfg);
  const doc = mapearADocumento(grupo, caso, net, clave, fechaDoc, cfg);
  const plano = generarPlanoCruce(doc);
  return { caso, net, doc, plano };
}

/**
 * Pipeline completo sobre un lote de filas crudas de cruceAut.
 * Solo procesa los grupos autoCruzables; el resto se devuelve para revisión.
 *
 * @param {Object[]} filas               Filas tal cual las retorna la query
 * @param {Object} [opts]
 * @param {ConfigCruce} [opts.cfg]
 * @param {number} [opts.umbralConfianza]
 * @param {(grupoDocs:DocNormalizado[])=>string} [opts.fechaResolver]
 *        Determina la fecha de la NI por grupo. Default: fechaDocto de la 1ª FVE.
 * @returns {{ procesados: object[], gruposManuales: object[], revision: object[] }}
 */
export function procesarLote(filas, opts = {}) {
  const { cfg = configCruceDefault, umbralConfianza = 0.8 } = opts;
  const fechaResolver =
    opts.fechaResolver ?? ((docs) => (docs.find((d) => d.tipo === 'FVE')?.fechaDocto ?? ''));

  const norm = filas.map(normalizar);
  const { grupos, revision } = emparejar(norm, { umbralConfianza });

  const procesados = [];
  const gruposManuales = [];

  for (const g of grupos) {
    if (!g.autoCruzable) {
      gruposManuales.push(g);
      continue;
    }
    const fechaDoc = fechaResolver(g.docs);
    const { caso, net, doc, plano } = procesarGrupo(g.docs, g.clave, fechaDoc, cfg);
    procesados.push({ tercero: g.tercero, clave: g.clave, confianza: g.confianza, caso, net, doc, plano });
  }

  return { procesados, gruposManuales, revision };
}