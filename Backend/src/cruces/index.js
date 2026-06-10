// 
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

// ---- Re-exports para quien importe desde afuera del módulo ----
export { normalizar, clavesDesdeNotas, clavesDesdeFVE } from './normalizador.js';
export { emparejar } from './matcher.js';
export { clasificar } from './clasificador.js';
export { mapearADocumento } from './mapper.js';
export { generarPlanoCruce } from './siesaPlano.js';
export { aPayloadConector } from './siesaConector.js';
export { configCruceDefault } from './config.js';

// ---- Imports locales para las funciones de conveniencia ----
import { normalizar } from './normalizador.js';
import { emparejar } from './matcher.js';
import { clasificar } from './clasificador.js';
import { mapearADocumento } from './mapper.js';
import { generarPlanoCruce } from './siesaPlano.js';
import { aPayloadConector } from './siesaConector.js';
import { configCruceDefault } from './config.js';

/** @typedef {import('./normalizador.js').DocNormalizado} DocNormalizado */
/** @typedef {import('./normalizador.js').Clave} Clave */
/** @typedef {import('./config.js').ConfigCruce} ConfigCruce */

/**
 * Procesa un grupo YA emparejado de punta a punta.
 * @param {DocNormalizado[]} grupo
 * @param {Clave} clave
 * @param {string} fechaDoc  "AAAAMMDD"
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
 * @param {Object[]} filas
 * @param {Object} [opts]
 * @param {ConfigCruce} [opts.cfg]
 * @param {number} [opts.umbralConfianza]
 * @param {(grupoDocs:DocNormalizado[])=>string} [opts.fechaResolver]
 * @returns {{ procesados: object[], gruposManuales: object[], revision: object[] }}
 */
export function procesarLote(filas, opts = {}) {
  const { cfg = configCruceDefault, umbralConfianza = 0.8 } = opts;
  const fechaResolver =
    opts.fechaResolver ??
    ((docs) => {
      const fechaFve = docs
        .filter(d => d.tipo === 'FVE')
        .reduce((max, d) => d.fechaDocto > max ? d.fechaDocto : max, '');
      const fechaRc  = docs
        .filter((d) => d.tipo !== 'FVE')
        .reduce((max, d) => (d.fechaDocto > max ? d.fechaDocto : max), '');
      return fechaFve >= fechaRc ? fechaFve : fechaRc;
    });

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
    procesados.push({ tercero: g.tercero, razonSocial: g.docs[0]?.razonSocial ?? '', clave: g.clave, confianza: g.confianza, caso, net, doc, plano });
  }

  return { procesados, gruposManuales, revision };
}