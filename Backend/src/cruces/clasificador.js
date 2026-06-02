// 
//
// El corazón del módulo: dado un grupo de documentos (FVE + RC/RAC) unidos por
// la misma llave de cruce y el mismo tercero, el SIGNO y la MAGNITUD del saldo
// neto determinan el caso. Por ahora solo se trabaja con FVE (cuenta 1305);
// las NCE quedan fuera.
//
//   net = ΣFVE (+) + ΣRC (-)
//     net == 0                      -> MATCH_PERFECTO   (Caso 1)
//     net  > 0 y <= umbral          -> SALDO_EN_CONTRA  (Caso 5, ajuste a gasto)
//     net  > 0 y  > umbral          -> PAGO_PARCIAL     (Caso 2, FVE queda abierta)
//     net  < 0 y |.| <= umbral      -> SALDO_A_FAVOR    (Caso 4, ajuste a ingreso)
//     net  < 0 y |.|  > umbral      -> CREDITO_A_FAVOR  (Caso 3, RC queda con saldo)

/** @typedef {import('./config.js').ConfigCruce} ConfigCruce */
/** @typedef {import('./normalizador.js').DocNormalizado} DocNormalizado */

/**
 * @typedef {'MATCH_PERFECTO'|'SALDO_EN_CONTRA'|'PAGO_PARCIAL'|'SALDO_A_FAVOR'|'CREDITO_A_FAVOR'} CasoCruce
 */

/**
 * @typedef {Object} ResultadoClasificacion
 * @property {CasoCruce} caso
 * @property {number} net           Residual con signo
 * @property {boolean} requiereAjuste
 */

/**
 * @param {DocNormalizado[]} grupo
 * @param {ConfigCruce} cfg
 * @returns {ResultadoClasificacion}
 */
export function clasificar(grupo, cfg) {
  const sumF = grupo.filter((d) => d.tipo === 'FVE').reduce((a, d) => a + d.saldo, 0);
  const sumR = grupo.filter((d) => d.tipo !== 'FVE').reduce((a, d) => a + d.saldo, 0);
  const net = Number((sumF + sumR).toFixed(2));

  if (net === 0) {
    return { caso: 'MATCH_PERFECTO', net, requiereAjuste: false };
  }
  if (net > 0) {
    return net <= cfg.umbralAjuste
      ? { caso: 'SALDO_EN_CONTRA', net, requiereAjuste: true }
      : { caso: 'PAGO_PARCIAL', net, requiereAjuste: false };
  }
  return Math.abs(net) <= cfg.umbralAjuste
    ? { caso: 'SALDO_A_FAVOR', net, requiereAjuste: true }
    : { caso: 'CREDITO_A_FAVOR', net, requiereAjuste: false };
}