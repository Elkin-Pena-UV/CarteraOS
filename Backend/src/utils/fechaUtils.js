/**
 * Último día del mes anterior → 'YYYYMMDD'
 * Ej: mayo 2026 → '20260430'
 */
const getFechaCorte = () => {
  const hoy = new Date();
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
  const año = ultimoDia.getFullYear();
  const mes = String(ultimoDia.getMonth() + 1).padStart(2, '0');
  const dia = String(ultimoDia.getDate()).padStart(2, '0');
  return `${año}${mes}${dia}`;
};

/**
 * Primer día del mes anterior → 'YYYYMMDD'
 * Ej: mayo 2026 → '20260401'
 */
const getFechaInicioMes = () => {
  const hoy = new Date();
  const año = hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear();
  const mes = String(hoy.getMonth() === 0 ? 12 : hoy.getMonth()).padStart(2, '0');
  return `${año}${mes}01`;
};

/**
 * Primer día del mes de una fecha dada en formato 'YYYYMMDD'
 * Ej: '20260506' → '20260501'
 */
const getFechaInicioMesDe = (fechaYYYYMMDD) => {
  const año = fechaYYYYMMDD.substring(0, 4);
  const mes = fechaYYYYMMDD.substring(4, 6);
  return `${año}${mes}01`;
};

/**
 * Fecha de hoy → 'YYYYMMDD'
 */
const getFechaHoy = () => {
  const hoy = new Date();
  const año = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${año}${mes}${dia}`;
};

/**
 * Valida y normaliza una fecha libre recibida del cliente.
 * Acepta 'YYYYMMDD' o 'YYYY-MM-DD'.
 * Retorna 'YYYYMMDD' si es válida, null si no.
 */
const parsearFechaCorte = (fechaStr) => {
  if (!fechaStr) return null;

  // Normalizar: quitar guiones si vienen en formato ISO
  const limpia = String(fechaStr).replace(/-/g, '');

  if (!/^\d{8}$/.test(limpia)) return null;

  const año = parseInt(limpia.substring(0, 4), 10);
  const mes = parseInt(limpia.substring(4, 6), 10);
  const dia = parseInt(limpia.substring(6, 8), 10);

  // Validar rangos básicos
  if (mes < 1 || mes > 12) return null;
  if (dia < 1 || dia > 31) return null;

  // Validar que la fecha exista realmente (evita 20260231, etc.)
  const fecha = new Date(año, mes - 1, dia);
  if (
    fecha.getFullYear() !== año ||
    fecha.getMonth() + 1 !== mes ||
    fecha.getDate() !== dia
  ) return null;

  return limpia;
};

/**
 * Último día de un mes específico → 'YYYYMMDD'
 * @param {number} año
 * @param {number} mes - 1-12
 */

const getUltimoDiaDelMes = (año, mes) => {
  const ultimoDia = new Date(año, mes, 0); // día 0 del mes siguiente = último del actual
  const a = ultimoDia.getFullYear();
  const m = String(ultimoDia.getMonth() + 1).padStart(2, '0');
  const d = String(ultimoDia.getDate()).padStart(2, '0');
  return `${a}${m}${d}`;
};

/**
 * Primer día de un mes específico → 'YYYYMMDD'
 */
const getPrimerDiaDelMes = (año, mes) => {
  const m = String(mes).padStart(2, '0');
  return `${año}${m}01`;
};

/**
 * Genera los últimos N periodos hasta una fecha de referencia.
 * Retorna array de objetos { periodo, año, mes, fechaInicio, fechaFin }
 * @param {string} fechaRefYYYYMMDD - Fecha de referencia (último periodo incluido)
 * @param {number} cantidad         - Cantidad de periodos hacia atrás (incluyendo el de referencia)
 * Ej: getUltimosPeriodos('20260331', 12) → 12 periodos desde 202504 hasta 202603
 */
const getUltimosPeriodos = (fechaRefYYYYMMDD, cantidad) => {
  const añoRef = parseInt(fechaRefYYYYMMDD.substring(0, 4), 10);
  const mesRef = parseInt(fechaRefYYYYMMDD.substring(4, 6), 10);

  const periodos = [];
  for (let i = cantidad - 1; i >= 0; i--) {
    const fecha = new Date(añoRef, mesRef - 1 - i, 1);
    const año = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;
    periodos.push({
      periodo: `${año}${String(mes).padStart(2, '0')}`,
      año,
      mes,
      fechaInicio: getPrimerDiaDelMes(año, mes),
      fechaFin: getUltimoDiaDelMes(año, mes),
    });
  }
  return periodos;
};

export { getFechaCorte, getFechaInicioMes, getFechaInicioMesDe, getFechaHoy, parsearFechaCorte, getUltimoDiaDelMes, getPrimerDiaDelMes, getUltimosPeriodos };