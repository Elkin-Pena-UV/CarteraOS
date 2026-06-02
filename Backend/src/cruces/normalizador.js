// 
//
// Convierte cada fila cruda de la consulta `cruceAut` en un documento
// normalizado, y le extrae sus llaves de cruce candidatas (PVC u OC) con un
// score de confianza. Para FVE las llaves vienen en columnas estructuradas;
// para RC/RAC vienen enterradas en texto libre (f1_notas).

/**
 * @typedef {Object} Clave
 * @property {'PVC'|'OC'|'NUM'} tipo
 * @property {string} valor
 * @property {number} confianza   0..1
 */

/**
 * @typedef {Object} DocNormalizado
 * @property {string} tercero       NIT del cliente
 * @property {'FVE'|'RC'|'RAC'} tipo
 * @property {string} auxiliar      "13050505" | "28050505"
 * @property {string} consecCruce   Consecutivo del docto, sin ceros: "156607"
 * @property {string} sucursal      f1_tercero_suc -> "001"
 * @property {string} fechaDocto    "AAAAMMDD"
 * @property {string} fechaVcto     "AAAAMMDD"
 * @property {string} terceroVend   NIT del vendedor
 * @property {number} saldo         FVE > 0, RC/RAC < 0
 * @property {string} notas         f1_notas original
 * @property {Clave[]} claves       Candidatas ordenadas por confianza
 */

/** ISO ("2026-05-13T00:00:00.000Z") -> "AAAAMMDD" */
const fechaPlano = (iso) => {
  if (!iso) return '';
  const s = iso instanceof Date ? iso.toISOString() : String(iso);
  return s.slice(0, 10).replace(/-/g, '');
};

/** "FVE-00156607" -> "156607" (sin ceros a la izquierda) */
const numDocto = (s) => ((s ?? '').match(/(\d+)\s*$/)?.[1] ?? '').replace(/^0+/, '');

/**
 * Extrae llaves desde texto libre (RC/RAC). Orden de confianza: PVC > OC > número suelto.
 * @param {string} notas
 * @returns {Clave[]}
 */
export function clavesDesdeNotas(notas) {
  const txt = notas ?? '';
  /** @type {Clave[]} */
  const out = [];

  const pvc = txt.match(/PVC\s*0*(\d{4,})/i);
  if (pvc) out.push({ tipo: 'PVC', valor: pvc[1], confianza: 0.95 });

  const oc = txt.match(/\bO\.?\s*C\.?\s*0*(\d{3,})/i); // "OC", "O.C", "Oc"
  if (oc) out.push({ tipo: 'OC', valor: oc[1], confianza: 0.9 });

  if (out.length === 0) {
    const num = txt.match(/\b0*(\d{5,})\b/); // fallback: número largo
    if (num) out.push({ tipo: 'NUM', valor: num[1], confianza: 0.5 });
  }
  return out;
}

/**
 * Extrae llaves desde columnas estructuradas (FVE).
 * @param {string|null} pedido  Pedido_docto, ej "001-PVC-00379474"
 * @param {string|null} oc      Orden_compra, ej "162875" / "29042026."
 * @returns {Clave[]}
 */
export function clavesDesdeFVE(pedido, oc) {
  /** @type {Clave[]} */
  const out = [];

  const pvc = (pedido ?? '').match(/PVC-?0*(\d+)/i);
  if (pvc) out.push({ tipo: 'PVC', valor: pvc[1], confianza: 1.0 });

  const ocNum = (oc ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (ocNum) out.push({ tipo: 'OC', valor: ocNum, confianza: 0.85 });

  return out;
}

/**
 * Normaliza una fila cruda de la consulta cruceAut.
 * @param {Object} fila  Fila tal cual la retorna la query
 * @returns {DocNormalizado}
 */
export function normalizar(fila) {
  const tipo = fila.f1_tipo_docto_cruce.trim();
  const esFactura = tipo === 'FVE';

  return {
    tercero: fila.f1_tercero.trim(),
    tipo,
    auxiliar: fila.f1_auxiliar.trim(),
    consecCruce: numDocto(fila.f1_docto_cruce),
    sucursal: fila.f1_tercero_suc,
    fechaDocto: fechaPlano(fila.f1_fecha_docto),
    fechaVcto: fechaPlano(fila.f1_fecha_vcto_docto),
    terceroVend: fila.f1_vend_cliente.trim(),
    saldo: fila.f1_saldo_total,
    notas: fila.f1_notas ?? '',
    claves: esFactura
      ? clavesDesdeFVE(fila.Pedido_docto, fila.Orden_compra)
      : clavesDesdeNotas(fila.f1_notas ?? ''),
  };
}