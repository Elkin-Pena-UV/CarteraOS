import { sql, poolPromise } from '../config/db_sm_real.js';
import logger from '../config/logger.js';

const getCruceAut = async () => {
  const tiempos = {};

  try {
    const t0 = Date.now();
    const pool = await poolPromise;
    const request = pool.request();
    tiempos.conexion = Date.now() - t0;

    const t1 = Date.now();
    const result = await request.query(`SELECT * FROM dbo.v_ti_cruce_aut`);
    tiempos.query = Date.now() - t1;
    tiempos.registros = result.recordset.length;
    tiempos.total = Date.now() - t0;

    if (tiempos.total > 500) {
      logger.warn(`⚠️  Query lenta cruce aut: ${JSON.stringify(tiempos)}`);
    } else {
      logger.debug(`✅ Query OK cruce aut: ${JSON.stringify(tiempos)}`);
    }

    return { data: result.recordset, tiempos };

  } catch (error) {
    logger.error('Error en getCruceAut:', error);
    throw error;
  }
};

export { getCruceAut };