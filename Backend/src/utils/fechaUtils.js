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

export { getFechaCorte, getFechaInicioMes, getFechaInicioMesDe, getFechaHoy };