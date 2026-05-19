import { sql, poolPromise } from '../config/db_sm_real.js';
import logger from '../config/logger.js';
import { getUltimosPeriodos } from '../utils/fechaUtils.js';

// Referencias que se consideran rebate (no venta bruta)
const REFERENCIAS_REBATE = ['0022530', '0022529'];

/**
 * Consulta el detalle de rotación (ventas) en un rango de fechas.
 */
const consultarDetalleRotacion = async (request, fechaInicio, fechaFin) => {
  request.input('fechaInicio', sql.VarChar(8), fechaInicio);
  request.input('fechaFin',    sql.VarChar(8), fechaFin);

  const query = `
    SELECT f_referencia, f_valor_subtotal_local
    FROM v_ti_rotacion_cartera
    WHERE f_fecha BETWEEN @fechaInicio AND @fechaFin
  `;
  const result = await request.query(query);
  return result.recordset;
};

/**
 * Consulta el saldo total de cartera auxiliar a una fecha.
 */
const consultarCarteraAux = async (request, fecha) => {
  request.input('fecha', sql.VarChar(8), fecha);

  const query = `SELECT f1_saldo_total FROM dbo.fn_ti_cartera_x_aux(@fecha)`;
  const result = await request.query(query);
  return result.recordset;
};

/**
 * Calcula ventas brutas y rebates a partir de los registros de rotación.
 *   - rebate = suma de f_valor_subtotal_local donde f_referencia ∈ REFERENCIAS_REBATE
 *   - ventaBruta = suma del resto
 */
const calcularVentas = (registros) => {
  let ventaBruta = 0;
  let rebate = 0;

  for (const r of registros) {
    const valor = Number(r.f_valor_subtotal_local) || 0;
    const ref = String(r.f_referencia || '').trim();

    if (REFERENCIAS_REBATE.includes(ref)) {
      rebate += valor;
    } else {
      ventaBruta += valor;
    }
  }

  return { ventaBruta, rebate, ventaNeta: ventaBruta - rebate };
};

/**
 * Suma el saldo total de cartera auxiliar.
 */
const calcularCartera = (registros) =>
  registros.reduce((acc, r) => acc + (Number(r.f1_saldo_total) || 0), 0);

/**
 * Construye la tabla de rotación de los últimos 12 meses respecto a la fecha de referencia.
 *
 * Para cada uno de los 12 periodos:
 *   - cartera     → saldo total de cartera auxiliar al último día del periodo
 *   - ventaBruta  → ∑ valor_subtotal_local SIN referencias de rebate
 *   - rebate      → ∑ valor_subtotal_local CON referencias de rebate
 *   - ventaNeta   → ventaBruta − rebate
 *   - prom3m      → promedio venta neta de los 3 periodos previos (incluyendo el actual)
 *   - acum12m     → suma de venta neta de los 12 periodos (rolling)
 *   - rotCxC      → (cartera / acum12m) × 360
 *
 * @param {string} fechaRef - Fecha de referencia YYYYMMDD (último periodo)
 */
const getRotacion = async (fechaRef) => {
  const tiempos = {};
  const t0 = Date.now();

  try {
    const pool = await poolPromise;
    tiempos.conexion = Date.now() - t0;

    // 🔑 Consultamos 23 periodos: 12 a mostrar + 11 previos
    // necesarios para que el acum12m del primer periodo visible
    // ya tenga sus 12 meses reales acumulados.
    const PERIODOS_VISIBLES = 12;
    const PERIODOS_HISTORICOS = 11;
    const TOTAL_PERIODOS = PERIODOS_VISIBLES + PERIODOS_HISTORICOS; // 23

    const periodos = getUltimosPeriodos(fechaRef, TOTAL_PERIODOS);
    logger.debug(
      `📅 Rotación: consultando ${periodos.length} periodos (${periodos[0].periodo}→${periodos[periodos.length - 1].periodo}), retornando últimos ${PERIODOS_VISIBLES}`
    );

    const t1 = Date.now();

    // Por cada periodo: 1 query de ventas + 1 query de cartera
    const resultados = await Promise.all(
      periodos.map(async (p, idx) => {
        // Solo necesitamos cartera para los periodos visibles (los últimos 12);
        // para los 11 previos basta con la venta bruta/neta (para alimentar prom3m y acum12m).
        const esVisible = idx >= PERIODOS_HISTORICOS;

        const [ventas, cartera] = await Promise.all([
          consultarDetalleRotacion(pool.request(), p.fechaInicio, p.fechaFin),
          esVisible
            ? consultarCarteraAux(pool.request(), p.fechaFin)
            : Promise.resolve([]),
        ]);

        const { ventaBruta, rebate, ventaNeta } = calcularVentas(ventas);
        return {
          periodo: p.periodo,
          cartera: calcularCartera(cartera),
          ventaBruta,
          rebate,
          ventaNeta,
        };
      })
    );

    tiempos.query = Date.now() - t1;

    // Calcular prom3m, acum12m, rotCxC sobre la serie completa de 23 periodos
    const dataCompleta = resultados.map((row, idx) => {
      // Promedio últimos 3 (incluido el actual) — sobre VENTA BRUTA
      const inicio3 = Math.max(0, idx - 2);
      const ventana3 = resultados.slice(inicio3, idx + 1);
      const promedioVentas3m =
        ventana3.reduce((acc, r) => acc + r.ventaBruta, 0) / ventana3.length;

      // Acumulado rolling últimos 12 (incluido el actual) — sobre VENTA NETA
      const inicio12 = Math.max(0, idx - 11);
      const ventana12 = resultados.slice(inicio12, idx + 1);
      const acumuladoVenta12m = ventana12.reduce((acc, r) => acc + r.ventaNeta, 0);

      const rotCxC =
        acumuladoVenta12m > 0
          ? Math.round((row.cartera / acumuladoVenta12m) * 360)
          : 0;

      return {
        ...row,
        promedioVentas3m: Math.round(promedioVentas3m),
        acumuladoVenta12m,
        rotCxC,
      };
    });

    // 🔑 Devolvemos solo los últimos PERIODOS_VISIBLES (12)
    const data = dataCompleta.slice(-PERIODOS_VISIBLES);

    tiempos.registros = data.length;
    tiempos.total = Date.now() - t0;

    if (tiempos.total > 1500) {
      logger.warn(`⚠️  Rotación lenta: ${JSON.stringify(tiempos)}`);
    } else {
      logger.debug(`✅ Rotación OK: ${JSON.stringify(tiempos)}`);
    }

    return {
      data,
      tiempos,
      fechaRef,
      periodos: data.map((d) => d.periodo),
    };

  } catch (error) {
    logger.error('Error en getRotacion:', error);
    throw error;
  }
};

export { getRotacion };