import { sql, poolPromise } from '../config/db_sm_real.js';

const getFacturasCliente = async (nit, page = 1, limit = 50, fechaCorte = null) => {
  const pool = await poolPromise;
  const request = pool.request();

  // Calcular offset para paginación
  const offset = (page - 1) * limit;

  request.input('nit', sql.VarChar, nit.trim());
  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const fechaValida = fechaCorte && /^\d{8}$/.test(fechaCorte) ? fechaCorte : null;
  const fechaSQL = fechaValida
    ? `CONVERT(DATE, '${fechaValida}', 112)`
    : `CAST(GETDATE() AS DATE)`;

  // 1️⃣ Query para contar el total
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM dbo.fn_ti_detalle_cartera(${fechaSQL})
    WHERE f1_tercero = @nit
  `;

  // 2️⃣ Query paginada (ordenada por saldo vencido descendente)
  const dataQuery = `
    SELECT *
    FROM dbo.fn_ti_detalle_cartera(${fechaSQL})
    WHERE f1_tercero = @nit
    ORDER BY f1_saldo_total DESC, f1_docto_causacion
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `;

  // Ejecutar ambas queries en paralelo
  const [countResult, dataResult] = await Promise.all([
    request.query(countQuery),
    request.query(dataQuery),
  ]);

  const total = countResult.recordset[0].total;
  const pages = Math.ceil(total / limit);

  return {
    data: dataResult.recordset,
    pagination: {
      total,
      page,
      limit,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    },
  };
};

export { getFacturasCliente };