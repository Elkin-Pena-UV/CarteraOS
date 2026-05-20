import { sql, poolPromise } from '../config/db_sm_real.js';
import {
  getUltimosCierres,
  getInicioVentanaMeses,
} from '../utils/fechaUtils.js';
import logger from '../config/logger.js';

const N_VISIBLES = 12;
const N_CALENTAMIENTO = 11;           // 11 previos para que el 1er visible tenga 12m completos
const N_TOTAL = N_VISIBLES + N_CALENTAMIENTO; // 23

// Referencias contables clasificadas como rebate
const REFERENCIAS_REBATE = ['0022530', '0022529'];

/**
 * Query A: ventas agregadas por período (YYYYMM) en una ventana.
 * Devuelve 13 filas para una ventana de 13 meses.
 */
const fetchVentasAgregadas = async (pool, fechaIni, fechaFin) => {
  const request = pool.request();
  request.input('fechaIni', sql.VarChar(8), fechaIni);
  request.input('fechaFin', sql.VarChar(8), fechaFin);

  // Construimos la lista de referencias rebate como parámetros separados
  // para evitar inyección y permitir que SQL use índices.
  const refsParams = REFERENCIAS_REBATE
    .map((ref, i) => {
      request.input(`ref${i}`, sql.VarChar, ref);
      return `@ref${i}`;
    })
    .join(', ');

  const query = `
    SELECT
      LEFT(CONVERT(varchar(8), f_fecha, 112), 6) AS periodo,
      SUM(CASE WHEN f_referencia NOT IN (${refsParams})
               THEN f_valor_subtotal_local ELSE 0 END) AS venta_bruta,
      SUM(CASE WHEN f_referencia IN (${refsParams})
               THEN f_valor_subtotal_local ELSE 0 END) AS rebate_negativo
    FROM v_ti_rotacion_cartera
    WHERE f_fecha >= @fechaIni
      AND f_fecha <  DATEADD(DAY, 1, @fechaFin)
    GROUP BY LEFT(CONVERT(varchar(8), f_fecha, 112), 6);
  `;

  const result = await request.query(query);
  return result.recordset; // [{ periodo: '202504', venta_bruta, rebate_negativo }, ...]
};

/**
 * Query B (x12): saldo total de cartera para una fecha de cierre.
 * Sumamos en SQL para no traer ~90 filas por cada cierre.
 */
const fetchSaldoCartera = async (pool, fechaCierre) => {
  const request = pool.request();
  request.input('fecha', sql.VarChar(8), fechaCierre);
  const result = await request.query(`
    SELECT SUM(f1_saldo_total) AS saldo
    FROM dbo.fn_ti_cartera_x_aux(@fecha);
  `);
  return result.recordset[0]?.saldo ?? 0;
};

/**
 * Recibe una serie de N_TOTAL (23) períodos: 11 de calentamiento + 12 visibles.
 * Calcula promedio-3m, acumulado-12m y rotCxC para los 12 visibles
 * usando los 11 previos como histórico. Devuelve solo los 12 visibles.
 */
const calcularSerie = (ventasMap, carteraMap, periodos) => {
  // Paso 1: armar la serie cruda completa (23 períodos)
  const serie = periodos.map((periodo) => {
    const v = ventasMap.get(periodo) ?? { venta_bruta: 0, rebate_negativo: 0 };
    const ventaBruta = Number(v.venta_bruta) || 0;
    const rebateNeg  = Number(v.rebate_negativo) || 0;
    const ventaNeta  = ventaBruta + rebateNeg;
    const rebateAbs  = Math.abs(rebateNeg);

    return {
      periodo,
      cartera: Number(carteraMap.get(periodo) ?? 0), // 0 para los meses de calentamiento
      ventaBruta,
      rebate: rebateAbs,
      ventaNeta,
      promedioVentas3m: 0,
      acumuladoVenta12m: 0,
      rotCxC: 0,
    };
  });

  // Paso 2: calcular ventanas móviles SOLO para los visibles (i >= N_CALENTAMIENTO)
  // En esos índices ya tenemos garantizados los 11 previos.
  for (let i = N_CALENTAMIENTO; i < serie.length; i++) {
    const sum3 = serie[i].ventaNeta + serie[i - 1].ventaNeta + serie[i - 2].ventaNeta;
    serie[i].promedioVentas3m = sum3 / 3;

    let sum12 = 0;
    for (let k = i - 11; k <= i; k++) sum12 += serie[k].ventaNeta;
    serie[i].acumuladoVenta12m = sum12;

    serie[i].rotCxC = serie[i].acumuladoVenta12m > 0
      ? Math.round((serie[i].cartera / serie[i].acumuladoVenta12m) * 360)
      : 0;
  }

  // Paso 3: devolver solo los 12 visibles
  return serie.slice(N_CALENTAMIENTO);
};

/**
 * Servicio principal: rotación de cartera para los 12 períodos
 * terminando en fechaCorte (formato YYYYMMDD).
 */
const getRotacion = async (fechaCorte) => {
  const tiempos = {};
  const t0 = Date.now();

  try {
    const pool = await poolPromise;
    tiempos.conexion = Date.now() - t0;

    // Ventana de períodos completa: 11 calentamiento + 12 visibles = 23
    const cierresTotales = getUltimosCierres(fechaCorte, N_TOTAL);
    const periodos = cierresTotales.map(c => c.substring(0, 6));

    // Ventana de cartera: SOLO los 12 visibles (los últimos)
    const cierresVisibles = cierresTotales.slice(N_CALENTAMIENTO);

    // Ventana de ventas: desde el 1er día del 1er período de calentamiento
    const fechaIniVentas = getInicioVentanaMeses(fechaCorte, N_TOTAL); // hace 23 meses, día 1
    const fechaFinVentas = fechaCorte;

    // Disparar en paralelo: 1 query de ventas (23 meses agregados) + 12 queries de cartera
    const t1 = Date.now();
    const [ventasRaw, ...saldos] = await Promise.all([
      fetchVentasAgregadas(pool, fechaIniVentas, fechaFinVentas),
      ...cierresVisibles.map(fc => fetchSaldoCartera(pool, fc)),
    ]);
    tiempos.queriesParalelas = Date.now() - t1;

    // Indexar por período
    const ventasMap = new Map(ventasRaw.map(r => [r.periodo, r]));

    // Cartera solo existe para los visibles → los de calentamiento quedan en 0
    const carteraMap = new Map(
      cierresVisibles.map((c, i) => [c.substring(0, 6), saldos[i]])
    );

    const data = calcularSerie(ventasMap, carteraMap, periodos);

    tiempos.registros = data.length;
    tiempos.total = Date.now() - t0;

    if (tiempos.total > 1000) {
      logger.warn(`⚠️  Rotación lenta: ${JSON.stringify(tiempos)}`);
    } else {
      logger.debug(`✅ Rotación OK: ${JSON.stringify(tiempos)}`);
    }

    return { data, tiempos, fechaCorte };
  } catch (error) {
    logger.error('Error en getRotacion:', error);
    throw error;
  }
};

export { getRotacion };