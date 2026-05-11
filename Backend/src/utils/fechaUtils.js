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

export { getFechaCorte, getFechaInicioMes, getFechaInicioMesDe, getFechaHoy, parsearFechaCorte };