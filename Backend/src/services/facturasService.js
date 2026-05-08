import { sql, poolPromise } from '../config/db_sm_real.js';

const getFacturasCliente = async (nit) => {
  const pool = await poolPromise;
  const request = pool.request();

  request.input('nit', sql.VarChar, nit.trim());

  const query = `
    SELECT *
    FROM dbo.fn_ti_detalle_cartera(CAST(GETDATE() AS DATE))
    WHERE f1_tercero = @nit
  `;

  const result = await request.query(query);
  return result.recordset;
};

export { getFacturasCliente };