import { sql, poolPromise } from '../config/db_sm_real.js';
import { getFechaCorte, getFechaHoy, getFechaInicioMesDe } from '../utils/fechaUtils.js';

const getCartera = async (modo = 'corte', tercero = null) => {
  const pool = await poolPromise;
  const request = pool.request();

  // Fecha de corte según modo
  const fechaCorte = modo === 'hoy' ? getFechaHoy() : getFechaCorte();

  // Primer día del mes de la fecha seleccionada
  const fechaInicio = getFechaInicioMesDe(fechaCorte);

  request.input('fechaCorte', sql.VarChar(8), fechaCorte);
  request.input('fechaInicio', sql.VarChar(8), fechaInicio);

  // Construir la query base
  let query = `
    SELECT * FROM dbo.fn_ti_cartera_con_rem(@fechaCorte, @fechaInicio, @fechaCorte)
  `;

  // Filtro opcional por tercero
  if (tercero) {
    request.input('tercero', sql.VarChar, tercero);
    query += ` WHERE f1_tercero = @tercero`;
  }

  query += ` ORDER BY f1_tercero`;

  const result = await request.query(query);
  return result.recordset;
};

export { getCartera };