import { sql, poolPromise } from '../config/db_sm_real.js';
import { getUltimosCierres, getInicioVentanaMeses } from '../utils/fechaUtils.js';
import logger from '../config/logger.js';

const REFERENCIAS_REBATE = ['0022530', '0022529'];
const N_VISIBLES      = 12;
const N_CALENTAMIENTO = 11;
const N_TOTAL         = N_VISIBLES + N_CALENTAMIENTO; // 23

// ─────────────────────────────────────────────────────────────────────────────
// Paso 1 — universo de clientes con sus metadatos (canal, condPago, saldo)
// Recibe los filtros y devuelve las filas que los pasan + la lista de
// razonSocial para filtrar ventas en el paso 2.
// ─────────────────────────────────────────────────────────────────────────────
const fetchClientesFiltrados = async (pool, fechaCorte, filtros) => {
  const { canal, condPago, razonSocial } = filtros;

  const request = pool.request();
  request.input('fecha', sql.VarChar(8), fechaCorte);
  const result = await request.query(`
    SELECT
      f1_tercero,
      f1_tercero_razon_social,
      f1_canal,
      f1_cond_pago_tipo,
      f1_saldo_total
    FROM dbo.fn_ti_cartera_x_aux(@fecha)
  `);

  let filas = result.recordset;

  // Filtros en Node (AND entre tipos, OR dentro del mismo tipo)
  if (canal.length > 0) {
    filas = filas.filter(r =>
      canal.some(c => r.f1_canal?.trim().toLowerCase().includes(c.toLowerCase()))
    )
  }
  if (condPago.length > 0) {
    filas = filas.filter(r =>
      condPago.some(cp => r.f1_cond_pago_tipo?.trim().toLowerCase() === cp.toLowerCase())
    )
  }
  if (razonSocial) {
    const term = razonSocial.trim().toLowerCase()
    filas = filas.filter(r =>
      r.f1_tercero_razon_social?.trim().toLowerCase().includes(term)
    )
  }

  // Deduplicar clientes por f1_tercero (NIT)
  const vistos = new Set()
  const clientesUnicos = filas.filter(r => {
    if (vistos.has(r.f1_tercero)) return false
    vistos.add(r.f1_tercero)
    return true
  })

  // Deduplicar razones sociales
  const listaRazonSocial = [...new Set(
    clientesUnicos.map(r => r.f1_tercero_razon_social?.trim()).filter(Boolean)
  )]

  return { clientes: clientesUnicos, listaRazonSocial }
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 2A — ventas agregadas por período, filtradas por lista de clientes
// ─────────────────────────────────────────────────────────────────────────────
const fetchVentasAgregadas = async (pool, fechaIni, fechaFin, listaRazonSocial) => {
  const request = pool.request();
  request.input('fechaIni', sql.VarChar(8), fechaIni);
  request.input('fechaFin', sql.VarChar(8), fechaFin);

  const refsParams = REFERENCIAS_REBATE.map((ref, i) => {
    request.input(`ref${i}`, sql.VarChar, ref);
    return `@ref${i}`;
  }).join(', ');

  // Si hay lista de clientes → filtrar; si está vacía → no hay resultados
  let whereCliente = ''
  // null = sin filtro → consulta todo
  if (listaRazonSocial === null) {
    // sin filtro → whereCliente queda '', consulta todo ✅
  }
  else if (listaRazonSocial.length === 0) {
    return []; // filtro activo sin resultados ✅
  }
  else {
    const clienteParams = listaRazonSocial.map((rs, i) => {
      request.input(`rs${i}`, sql.NVarChar, rs);
      return `@rs${i}`;
    }).join(', ');
    whereCliente = `AND f_cliente_fact_razon_soc IN (${clienteParams})`;
  }

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
      ${whereCliente}
    GROUP BY LEFT(CONVERT(varchar(8), f_fecha, 112), 6);
  `;

  const result = await request.query(query);
  return result.recordset;
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 2B — saldo de cartera para un cierre, filtrado directo en SQL
// ─────────────────────────────────────────────────────────────────────────────
const fetchSaldoCartera = async (pool, fechaCierre, listaRazonSocial) => {
  const request = pool.request();
  request.input('fecha', sql.VarChar(8), fechaCierre);

  let whereCliente = ''
  if (listaRazonSocial !== null && listaRazonSocial.length === 0) {
    return 0 // sin clientes → saldo 0
  }
  if (listaRazonSocial !== null && listaRazonSocial.length > 0) {
    listaRazonSocial.forEach((rs, i) => {
      request.input(`rs${i}`, sql.NVarChar, rs);
    });
    const params = listaRazonSocial.map((_, i) => `@rs${i}`).join(', ');
    whereCliente = `WHERE f1_tercero_razon_social IN (${params})`
  }

  const result = await request.query(`
    SELECT SUM(f1_saldo_total) AS saldo
    FROM dbo.fn_ti_cartera_x_aux(@fecha)
    ${whereCliente}
  `);
  return result.recordset[0]?.saldo ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Paso 3 — calcular serie de 12 períodos visibles
// ─────────────────────────────────────────────────────────────────────────────
const calcularSerie = (ventasMap, carteraMap, periodos) => {
  const serie = periodos.map((periodo) => {
    const v = ventasMap.get(periodo) ?? { venta_bruta: 0, rebate_negativo: 0 };
    const ventaBruta = Number(v.venta_bruta) || 0;
    const rebateNeg = Number(v.rebate_negativo) || 0;
    const ventaNeta = ventaBruta + rebateNeg;
    const rebateAbs = Math.abs(rebateNeg);
    return {
      periodo,
      cartera: Number(carteraMap.get(periodo) ?? 0),
      ventaBruta,
      rebate: rebateAbs,
      ventaNeta,
      promedioVentas3m: 0,
      acumuladoVenta12m: 0,
      rotCxC: 0,
    };
  });

  for (let i = N_CALENTAMIENTO; i < serie.length; i++) {
    serie[i].promedioVentas3m =
      (serie[i].ventaNeta + serie[i-1].ventaNeta + serie[i-2].ventaNeta) / 3;

    let sum12 = 0;
    for (let k = i - 11; k <= i; k++) sum12 += serie[k].ventaNeta;
    serie[i].acumuladoVenta12m = sum12;

    serie[i].rotCxC = serie[i].acumuladoVenta12m > 0
      ? Math.round((serie[i].cartera / serie[i].acumuladoVenta12m) * 360)
      : 0;
  }

  return serie.slice(N_CALENTAMIENTO);
}

// ─────────────────────────────────────────────────────────────────────────────
// Servicio principal
// ─────────────────────────────────────────────────────────────────────────────
const getRotacion = async (fechaCorte, filtros = {}) => {
  const {
    canal = [],   // string[]  ej: ['comercializador']
    condPago = [],   // string[]  ej: ['Credito']
    razonSocial = '',   // string
  } = filtros;

  const hayFiltros = canal.length > 0 || condPago.length > 0 || razonSocial.trim() !== '';

  const tiempos = {};
  const t0 = Date.now();

  try {
    const pool = await poolPromise;
    tiempos.conexion = Date.now() - t0;

    const cierresTotales = getUltimosCierres(fechaCorte, N_TOTAL);
    const cierresVisibles = cierresTotales.slice(N_CALENTAMIENTO);
    const periodos = cierresTotales.map(c => c.substring(0, 6));
    const fechaIniVentas = getInicioVentanaMeses(fechaCorte, N_TOTAL);

    // Paso 1 — universo de clientes
    let clientes = [];
    let listaRazonSocial = null;

    const t1 = Date.now();
    if (hayFiltros) {
      const resultado = await fetchClientesFiltrados(pool, fechaCorte, { canal, condPago, razonSocial });
      clientes = resultado.clientes;
      listaRazonSocial = resultado.listaRazonSocial;
    } else {
      // Sin filtros activos → igual traer lista completa de clientes para el combobox del frontend
      const resultado = await fetchClientesFiltrados(pool, fechaCorte, { canal: [], condPago: [], razonSocial: '' });
      clientes = resultado.clientes;
      // listaRazonSocial queda null → las queries de ventas y cartera no se filtran
    }
    tiempos.filtrado = Date.now() - t1;

    // Paso 2 — ventas + cartera en paralelo
    const t2 = Date.now();
    const [ventasRaw, ...saldos] = await Promise.all([
      fetchVentasAgregadas(pool, fechaIniVentas, fechaCorte, listaRazonSocial),
      ...cierresVisibles.map(fc => fetchSaldoCartera(pool, fc, listaRazonSocial)),
    ]);
    tiempos.queriesParalelas = Date.now() - t2;

    // Indexar por período
    const ventasMap = new Map(ventasRaw.map(r => [r.periodo, r]));
    const carteraMap = new Map(cierresVisibles.map((c, i) => [c.substring(0, 6), saldos[i]]));

    // Paso 3 — calcular serie
    // Cuando hay filtros Y no hay ventas para períodos de calentamiento,
    // los 11 meses previos sin datos quedan en 0 — correcto porque
    // calcularSerie ya maneja ventasMap con fallback a 0.
    // Para el caso sin filtros, pasamos el array completo desde SQL.
    let ventasParaSerie = ventasRaw;
    if (!hayFiltros) {
      // Sin filtros: la query de ventas trae los 23 meses, úsalos todos
      ventasParaSerie = ventasRaw;
    }

    const data = calcularSerie(ventasMap, carteraMap, periodos);

    tiempos.total = Date.now() - t0;
    tiempos.registros = data.length;

    if (tiempos.total > 1500) {
      logger.warn(`⚠️  Rotación lenta: ${JSON.stringify(tiempos)}`);
    } else {
      logger.debug(`✅ Rotación OK: ${JSON.stringify(tiempos)}`);
    }

    return { data, clientes, tiempos, fechaCorte };

  } catch (error) {
    logger.error('Error en getRotacion:', error);
    throw error;
  }
}

export { getRotacion };