// 
//
// Parámetros del módulo de cruce automático. NADA de esto debe quedar
// hardcodeado en la lógica: los informes exigen que el umbral y las cuentas
// sean configurables. Idealmente esto se carga desde BD / variables de entorno.

/**
 * @typedef {Object} ConfigCruce
 * @property {number} umbralAjuste   Umbral en COP para ajuste automático (default 5000)
 * @property {string} cuentaCartera  Auxiliar de cartera / clientes (1305)
 * @property {string} cuentaAnticipo Auxiliar de anticipos (2805)
 * @property {string} cuentaIngreso  Auxiliar de ingreso para saldo a favor (Caso 4)
 * @property {string} cuentaGasto    Auxiliar de gasto para saldo en contra (Caso 5)
 * @property {string} ccosto         Centro de costo del ajuste
 * @property {string} cia            Compañía
 * @property {string} co             Centro de operación
 * @property {string} tipoDoc        Tipo de documento (Nota Interna)
 * @property {string} un             Unidad de negocio
 */

/** @type {ConfigCruce} */
export const configCruceDefault = {
  umbralAjuste: 5000,
  cuentaCartera: '13050505',
  cuentaAnticipo: '28050505',
  cuentaIngreso: '42958102', // saldo a favor  -> crédito a ingreso
  cuentaGasto: '53059510',    // saldo en contra -> débito a gasto
  ccosto: '204505',
  cia: '001',
  co: '001',
  tipoDoc: 'NI',
  un: '01',
};