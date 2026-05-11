import { sql, poolPromise } from '../config/db_sm_real.js';
import { getFechaCorte, getFechaHoy, getFechaInicioMesDe } from '../utils/fechaUtils.js';
import logger from '../config/logger.js';

/**
 * Resuelve la fechaCorte según el modo recibido:
 *   'hoy'   → fecha de hoy                  (default)
 *   'corte' → último día del mes anterior
 *   'fecha' → fecha libre validada en el controller (formato YYYYMMDD)
 */
const resolverFechaCorte = (modo, fechaParam) => {
  if (modo === 'hoy')                       return getFechaHoy();
  if (modo === 'fecha' && fechaParam)        return fechaParam;
  if (modo === 'corte')                     return getFechaCorte();
  return getFechaHoy(); // fallback seguro
};

const getCartera = async (modo = 'hoy', tercero = null, fechaParam = null) => {
  const tiempos = {};

  try {
    const pool = await poolPromise;

    // 🆕 Medir tiempo de conexión
    const t0 = Date.now();
    const request = pool.request();
    tiempos.conexion = Date.now() - t0;

    const fechaCorte = resolverFechaCorte(modo, fechaParam);
    const fechaInicio = getFechaInicioMesDe(fechaCorte);

    logger.debug(`📅 Modo: ${modo} | fechaCorte: ${fechaCorte} | fechaInicio: ${fechaInicio}`);

    request.input('fechaCorte', sql.VarChar(8), fechaCorte);
    request.input('fechaInicio', sql.VarChar(8), fechaInicio);

    let query = `SELECT * FROM dbo.fn_ti_cartera_con_rem(@fechaCorte, @fechaInicio, @fechaCorte)`;

    if (tercero) {
      request.input('tercero', sql.VarChar, tercero);
      query += ` WHERE f1_tercero = @tercero`;
    }

    // 🆕 Medir tiempo de query
    const t1 = Date.now();
    const result = await request.query(query);
    tiempos.query = Date.now() - t1;
    tiempos.registros = result.recordset.length;
    tiempos.total = Date.now() - t0;

    // 🆕 Log automático si tarda más de 500ms
    if (tiempos.total > 500) {
      logger.warn(`⚠️  Query lenta: ${JSON.stringify(tiempos)}`);
    } else {
      logger.debug(`✅ Query OK: ${JSON.stringify(tiempos)}`);
    }

    return { data: result.recordset, tiempos, fechaCorte, fechaInicio };

  } catch (error) {
    logger.error('Error en getCartera:', error);
    throw error;
  }
};

export { getCartera };