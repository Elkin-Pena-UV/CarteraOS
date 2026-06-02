// 
//
// Genera el archivo plano del importador UNOEE de Siesa para una Nota Interna
// de cruce. Formato de ancho fijo, posiciones tomadas del spec oficial y
// VALIDADAS byte a byte contra planos reales.
//
// Registros:
//   0000  control apertura (18)
//   0350/00/02  documento contable / cabecera (333)
//   0351/00/02  movimiento contable -> línea de AJUSTE (485)   [valores en 116/137]
//   0351/01/02  movimiento CxC -> líneas de cartera (894)      [valores en 106/127]
//   9999  control cierre (18)
//
// IMPORTANTE: el archivo se escribe en latin-1, NO utf-8. Usar comillas rectas;
// los caracteres no latin-1 corren el ancho fijo.

/**
 * @typedef {Object} LineaCartera
 * @property {string} auxiliar     "13050505" | "28050505"
 * @property {string} tercero      NIT cliente
 * @property {number} [debito]
 * @property {number} [credito]
 * @property {string} notasMov     ej "PVC 379387"
 * @property {string} sucursal     f1_tercero_suc -> "001"
 * @property {'FVE'|'RC'|'RAC'} tipoCruce
 * @property {string} consecCruce  "156607" (se rellena a 8 con ceros)
 * @property {string} fechaVcto    "AAAAMMDD"
 * @property {string} [fechaDscto] default = fechaVcto
 * @property {string} terceroVend  f1_vend_cliente
 * @property {string} notas354     observación del cruce
 */

/**
 * @typedef {Object} LineaAjuste
 * @property {string} auxiliar     "42958102" (a favor) | "5305951" (en contra)
 * @property {string} tercero
 * @property {string} ccosto       "204505"
 * @property {number} [debito]     en contra
 * @property {number} [credito]    a favor
 * @property {string} notas        "Ajuste al peso"
 */

/**
 * @typedef {Object} DocumentoCruce
 * @property {string} [cia]        default "001"
 * @property {string} [co]         default "001"
 * @property {string} [tipoDoc]    default "NI"
 * @property {string} [consec]     default "00000001"
 * @property {string} [un]         default "01"
 * @property {string} fecha        "AAAAMMDD" (fecha de la factura)
 * @property {string} tercero
 * @property {string} notas
 * @property {LineaAjuste} [ajuste]  solo Caso 4/5
 * @property {LineaCartera[]} lineas
 */

// ---- helpers de ancho fijo ----
const padTxt = (s, w) => (s ?? '').slice(0, w).padEnd(w, ' ');
const padNum = (s, w) => String(s ?? '').padStart(w, '0');
const valor = (n = 0) => Math.round(n).toString().padStart(16, '0') + '.0000'; // 21 chars
const ascii = (s) =>
  (s ?? '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\u0000-\u00FF]/g, '?');
const ZV = valor(0);

function put(buf, inicio1, text) {
  const i = inicio1 - 1;
  for (let k = 0; k < text.length; k++) buf[i + k] = text[k];
}
const blank = (w) => Array(w).fill(' ');

function control(seq, tipo) {
  return `${padNum(seq, 7)}${tipo}0001001`; // tipo: "0000" | "9999"
}

function rec350(seq, d) {
  const b = blank(333);
  put(b, 1, padNum(seq, 7)); put(b, 8, '0350'); put(b, 12, '00'); put(b, 14, '02');
  put(b, 16, padTxt(d.cia ?? '001', 3)); put(b, 19, '1');
  put(b, 20, padTxt(d.co ?? '001', 3)); put(b, 23, padTxt(d.tipoDoc ?? 'NI', 3));
  put(b, 26, padNum(d.consec ?? '00000001', 8)); put(b, 34, d.fecha);
  put(b, 42, padTxt(d.tercero, 15)); put(b, 57, '00030'); put(b, 62, '1'); put(b, 63, '0');
  put(b, 64, padTxt(ascii(d.notas), 255));
  return b.join('');
}

function rec351cxc(seq, d, l) {
  const b = blank(894);
  put(b, 1, padNum(seq, 7)); put(b, 8, '0351'); put(b, 12, '01'); put(b, 14, '02');
  put(b, 16, padTxt(d.cia ?? '001', 3)); put(b, 19, padTxt(d.co ?? '001', 3));
  put(b, 22, padTxt(d.tipoDoc ?? 'NI', 3)); put(b, 25, padNum(d.consec ?? '00000001', 8));
  put(b, 33, padTxt(l.auxiliar, 20)); put(b, 53, padTxt(l.tercero, 15));
  put(b, 68, padTxt(d.co ?? '001', 3)); put(b, 71, padTxt(d.un ?? '01', 20));
  put(b, 106, valor(l.debito)); put(b, 127, valor(l.credito));
  put(b, 148, ZV); put(b, 169, ZV); put(b, 190, padTxt(ascii(l.notasMov), 255));
  put(b, 445, padNum(l.sucursal, 3)); put(b, 448, padTxt(l.tipoCruce, 3));
  put(b, 451, padNum(l.consecCruce, 8)); put(b, 459, '000');
  put(b, 462, l.fechaVcto); put(b, 470, l.fechaDscto ?? l.fechaVcto);
  put(b, 478, ZV); put(b, 499, ZV); put(b, 520, ZV);
  put(b, 541, ZV); put(b, 562, ZV); put(b, 583, ZV); put(b, 604, ZV);
  put(b, 625, padTxt(l.terceroVend, 15)); put(b, 640, padTxt(ascii(l.notas354), 255));
  return b.join('');
}

function rec351mov(seq, d, a) {
  const b = blank(485);
  put(b, 1, padNum(seq, 7)); put(b, 8, '0351'); put(b, 12, '00'); put(b, 14, '02');
  put(b, 16, padTxt(d.cia ?? '001', 3)); put(b, 19, padTxt(d.co ?? '001', 3));
  put(b, 22, padTxt(d.tipoDoc ?? 'NI', 3)); put(b, 25, padNum(d.consec ?? '00000001', 8));
  put(b, 33, padTxt(a.auxiliar, 20)); put(b, 53, padTxt(a.tercero, 15));
  put(b, 91, padTxt(a.ccosto, 15));
  put(b, 116, valor(a.debito)); put(b, 137, valor(a.credito));
  put(b, 158, ZV); put(b, 179, ZV); put(b, 200, ZV); put(b, 223, '00000000');
  put(b, 231, padTxt(ascii(a.notas), 255));
  return b.join('');
}

/**
 * Genera el contenido del plano para un cruce.
 * Para escribir a disco: Buffer.from(texto, 'latin1').
 * @param {DocumentoCruce} d
 * @returns {string}
 */
export function generarPlanoCruce(d) {
  const out = [];
  let seq = 1;
  out.push(control(seq++, '0000'));
  out.push(rec350(seq++, d));
  if (d.ajuste) out.push(rec351mov(seq++, d, d.ajuste)); // ajuste antes de cartera
  for (const l of d.lineas) out.push(rec351cxc(seq++, d, l));
  out.push(control(seq++, '9999'));
  return out.join('\n') + '\n';
}