import { sql, poolPromise } from '../config/db_sm_real.js';
import logger from '../config/logger.js';

/**
 * Consulta la variación de cartera para una fecha dada.
 * @param {string} fecha - Formato YYYYMMDD (ej: '20260508')
 */
const getVariacion = async (fecha) => {
  const tiempos = {};

  try {
    const t0 = Date.now();
    const pool = await poolPromise;
    const request = pool.request();
    tiempos.conexion = Date.now() - t0;

    request.input('fecha', sql.VarChar(8), fecha);

    const query = `SELECT * FROM dbo.fn_variacion_cartera(@fecha)`;

    const t1 = Date.now();
    const result = await request.query(query);
    tiempos.query = Date.now() - t1;
    tiempos.registros = result.recordset.length;
    tiempos.total = Date.now() - t0;

    if (tiempos.total > 500) {
      logger.warn(`⚠️  Query lenta variación cartera: ${JSON.stringify(tiempos)}`);
    } else {
      logger.debug(`✅ Query OK variación cartera: ${JSON.stringify(tiempos)}`);
    }

    return { data: result.recordset, tiempos, fecha };

  } catch (error) {
    logger.error('Error en getVariacion:', error);
    throw error;
  }
};

export { getVariacion };