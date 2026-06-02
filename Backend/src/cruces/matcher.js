// 
//
// Agrupa los documentos normalizados en grupos cruzables. Un cruce solo ocurre
// entre documentos del MISMO tercero que comparten una llave (PVC u OC).
//
// Estrategia de emparejamiento (matching):
//   1. Se ignoran NCE y cualquier tipo fuera de FVE/RC/RAC (fuera de alcance).
//   2. Se agrupa por tercero.
//   3. Dentro del tercero se indexan los documentos por VALOR de llave.
//   4. Para cada valor que aparece a la vez en una FVE y en una RC se forma un
//      grupo. Se procesan en orden de prioridad: PVC en ambos lados > OC en
//      ambos > coincidencia con número suelto. Un documento solo entra a UN
//      grupo (greedy), priorizando la llave más fuerte.
//   5. La confianza del grupo = mínimo de la confianza de la llave en cada lado.
//      Por debajo del umbral el grupo se marca autoCruzable=false (no se cruza
//      solo, queda para revisión).
//   6. Lo que no se pudo emparejar (RC sin llave, FVE sin contraparte, etc.)
//      va a la cola de revisión con su motivo.
//
// NOTA v1: un solo RC que debería cubrir varios PVC distintos, o asignación
// parcial de saldos entre grupos, NO se resuelve aquí — esos casos caen a
// revisión. Es deliberado: preferimos no cruzar mal.

/** @typedef {import('./normalizador.js').DocNormalizado} DocNormalizado */
/** @typedef {import('./normalizador.js').Clave} Clave */

/**
 * @typedef {Object} GrupoCruce
 * @property {string} tercero
 * @property {Clave} clave
 * @property {DocNormalizado[]} docs          FVE(s) + RC(s)
 * @property {number} confianza
 * @property {boolean} autoCruzable
 */

/**
 * @typedef {Object} ItemRevision
 * @property {DocNormalizado} doc
 * @property {string} motivo
 */

const TIPOS_CRUZABLES = new Set(['FVE', 'RC', 'RAC']);
const esFactura = (d) => d.tipo === 'FVE';

const prioridadTipo = (t) => (t === 'PVC' ? 3 : t === 'OC' ? 2 : 1);

/**
 * @param {DocNormalizado[]} docs   Documentos ya normalizados (de varios terceros)
 * @param {Object} [opts]
 * @param {number} [opts.umbralConfianza=0.8]
 * @returns {{ grupos: GrupoCruce[], revision: ItemRevision[] }}
 */
export function emparejar(docs, { umbralConfianza = 0.8 } = {}) {
  /** @type {GrupoCruce[]} */
  const grupos = [];
  /** @type {ItemRevision[]} */
  const revision = [];

  // Agrupar por tercero, ignorando tipos fuera de alcance
  /** @type {Map<string, DocNormalizado[]>} */
  const porTercero = new Map();
  for (const d of docs) {
    if (!TIPOS_CRUZABLES.has(d.tipo)) continue;
    if (!porTercero.has(d.tercero)) porTercero.set(d.tercero, []);
    porTercero.get(d.tercero).push(d);
  }

  for (const [tercero, docsT] of porTercero) {
    // Indexar por valor de llave: valor -> { fves:[{doc,conf,tipo}], rcs:[...] }
    /** @type {Map<string, {fves:{doc:DocNormalizado,conf:number,tipo:string}[], rcs:{doc:DocNormalizado,conf:number,tipo:string}[]}>} */
    const porValor = new Map();
    for (const d of docsT) {
      for (const c of d.claves) {
        if (!porValor.has(c.valor)) porValor.set(c.valor, { fves: [], rcs: [] });
        const slot = porValor.get(c.valor);
        const lado = esFactura(d) ? slot.fves : slot.rcs;
        if (!lado.some((x) => x.doc === d)) lado.push({ doc: d, conf: c.confianza, tipo: c.tipo });
      }
    }

    // Candidatos: valores con al menos 1 FVE y 1 RC
    const candidatos = [];
    for (const [valor, { fves, rcs }] of porValor) {
      if (fves.length === 0 || rcs.length === 0) continue;
      const tipoF = fves.some((x) => x.tipo === 'PVC') ? 'PVC' : fves.some((x) => x.tipo === 'OC') ? 'OC' : 'NUM';
      const tipoR = rcs.some((x) => x.tipo === 'PVC') ? 'PVC' : rcs.some((x) => x.tipo === 'OC') ? 'OC' : 'NUM';
      const tipo = prioridadTipo(tipoF) <= prioridadTipo(tipoR) ? tipoF : tipoR; // el más débil define el tipo del match
      const confF = Math.max(...fves.map((x) => x.conf));
      const confR = Math.max(...rcs.map((x) => x.conf));
      const confianza = Math.min(confF, confR);
      candidatos.push({ valor, tipo, confianza, prioridad: prioridadTipo(tipo), fves, rcs });
    }

    // Procesar por prioridad de tipo y luego confianza (PVC primero)
    candidatos.sort((a, b) => b.prioridad - a.prioridad || b.confianza - a.confianza);

    const usados = new Set();
    for (const c of candidatos) {
      const fvesDisp = c.fves.filter((x) => !usados.has(x.doc)).map((x) => x.doc);
      const rcsDisp = c.rcs.filter((x) => !usados.has(x.doc)).map((x) => x.doc);
      if (fvesDisp.length === 0 || rcsDisp.length === 0) continue;

      for (const d of [...fvesDisp, ...rcsDisp]) usados.add(d);
      grupos.push({
        tercero,
        clave: { tipo: c.tipo, valor: c.valor, confianza: c.confianza },
        docs: [...fvesDisp, ...rcsDisp],
        confianza: c.confianza,
        autoCruzable: c.confianza >= umbralConfianza,
      });
    }

    // Sobrantes -> revisión
    for (const d of docsT) {
      if (usados.has(d)) continue;
      let motivo;
      if (d.claves.length === 0) {
        motivo = esFactura(d) ? 'FVE sin llave (PVC/OC) identificable' : 'RC sin llave (PVC/OC) en notas';
      } else {
        motivo = esFactura(d) ? 'FVE sin anticipo con llave coincidente' : 'RC sin factura con llave coincidente';
      }
      revision.push({ doc: d, motivo });
    }
  }

  return { grupos, revision };
}