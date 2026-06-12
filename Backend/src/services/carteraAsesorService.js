import { sql, poolPromise } from '../config/db_sm_real.js';
import { getFechaCorte, getFechaHoy, getFechaInicioMesDe } from '../utils/fechaUtils.js';
import logger from '../config/logger.js';

// ── Misma lógica de resolución que carteraService ─────────────────────────────
const resolverFechaCorte = (modo, fechaParam) => {
  if (modo === 'hoy')              return getFechaHoy();
  if (modo === 'fecha' && fechaParam) return fechaParam;
  if (modo === 'corte')            return getFechaCorte();
  return getFechaHoy();
};

// ── Agrupación por tercero + condPago + canal ─────────────────────────────────
const CAMPOS_SUMABLES = [
  'f1_saldo_corriente_total',
  'f1_saldo_vencido1',
  'f1_saldo_vencido2',
  'f1_saldo_vencido3',
  'f1_saldo_vencido4',
  'f1_saldo_vencido_total',
  'f1_saldo_total',
  'f1_total_cop',
  'f_rem_valor_neto_total',
  'f_rem_peso_total',
  'f_rem_cantidad_documentos',
];

const agruparComoGeneral = (rows) => {
  const mapa = new Map();

  for (const row of rows) {
    const clave = `${row.f1_tercero?.trim()}||${row.f1_id_cond_pago?.trim()}||${row.f1_canal_cliente?.trim()}`;
    let acc = mapa.get(clave);

    // Si no existe aún una entrada para esta combinación, la inicializamos con los datos del primer registro encontrado
    
    if (!acc) {
      acc = { ...row };
      delete acc.f1_razon_vend_cliente;
      acc.f1_asesores = [];
      for (const c of CAMPOS_SUMABLES) acc[c] = 0;
      mapa.set(clave, acc);
    }

    // Sumar campos numéricos

    for (const c of CAMPOS_SUMABLES) {
      acc[c] += Number(row[c] ?? 0);
    }

    // Extraemos el asesor (vendedor) y lo agregamos al array de asesores únicos
    const asesorRaw = row.f1_razon_vend_cliente?.trim();
    if (asesorRaw && !acc.f1_asesores.includes(asesorRaw)) {
      acc.f1_asesores.push(asesorRaw);
    }

    for (const f of ['f1_fecha_docto_min', 'f1_fecha_vcto_min']) {
      if (row[f] && (!acc[f] || row[f] < acc[f])) acc[f] = row[f];
    }
    for (const f of ['f1_fecha_docto_max', 'f1_fecha_vcto_max']) {
      if (row[f] && (!acc[f] || row[f] > acc[f])) acc[f] = row[f];
    }
  }

  const result = Array.from(mapa.values());
  result.sort((a, b) => {
    const r = (a.f1_tercero_razon_social ?? '').localeCompare(b.f1_tercero_razon_social ?? '', 'es');
    return r !== 0 ? r : (a.f1_tercero ?? '').localeCompare(b.f1_tercero ?? '');
  });

  return result;
};

/**
 * Mismos parámetros que getCartera:
 *   modo      → 'hoy' | 'corte' | 'fecha'
 *   fechaParam → YYYYMMDD (solo si modo='fecha')
 *   tercero   → NIT (opcional)
 *   asesores  → string[] (opcional) — filtro extra propio de este módulo
 */
const getCarteraAsesor = async (modo = 'hoy', tercero = null, fechaParam = null, asesores = null) => {
  const tiempos = {};

  try {
    const t0   = Date.now();
    const pool = await poolPromise;
    const request = pool.request();
    tiempos.conexion = Date.now() - t0;

    const fechaCorte  = resolverFechaCorte(modo, fechaParam);
    const fechaInicio = getFechaInicioMesDe(fechaCorte);
    const fechaFin    = fechaCorte; // siempre igual al corte

    logger.debug(`📅 [AsesorService] Modo: ${modo} | fechaCorte: ${fechaCorte} | fechaInicio: ${fechaInicio}`);

    request.input('fechaCorte',  sql.VarChar(8), fechaCorte);
    request.input('fechaInicio', sql.VarChar(8), fechaInicio);
    request.input('fechaFin',    sql.VarChar(8), fechaFin);

    // Filtro opcional por asesor(es)
    let whereClause = '';
    const conditions = [];

    if (tercero) {
      request.input('tercero', sql.VarChar, tercero);
      conditions.push('LTRIM(RTRIM(f1_tercero)) = @tercero');
    }
    if (Array.isArray(asesores) && asesores.length > 0) {
      const params = asesores.map((a, i) => {
        request.input(`asesor${i}`, sql.VarChar, a);
        return `@asesor${i}`;
      }).join(', ');
      conditions.push(`LTRIM(RTRIM(f1_razon_vend_cliente)) IN (${params})`);
    }
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    const query = `
      SELECT *
      FROM dbo.fn_ti_cartera_con_rem_x_asesor(@fechaCorte, @fechaInicio, @fechaFin)
      ${whereClause}
    `;

    const t1 = Date.now();
    const result = await request.query(query);
    tiempos.query      = Date.now() - t1;
    tiempos.filasCrudas = result.recordset.length;

    const data = agruparComoGeneral(result.recordset);

    tiempos.registros = data.length;
    tiempos.total     = Date.now() - t0;

    if (tiempos.total > 500) {
      logger.warn(`⚠️  Query lenta cartera x asesor: ${JSON.stringify(tiempos)}`);
    } else {
      logger.debug(`✅ Query OK cartera x asesor: ${JSON.stringify(tiempos)}`);
    }

    return { data, tiempos, fechaCorte, fechaInicio };

  } catch (error) {
    logger.error('Error en getCarteraAsesor:', error);
    throw error;
  }
};

/**
 * Lista de asesores únicos disponibles para un período.
 * Mismos parámetros de fecha que getCarteraAsesor.
 */
const getAsesores = async (modo = 'hoy', fechaParam = null) => {
  try {
    const pool    = await poolPromise;
    const request = pool.request();

    const fechaCorte  = resolverFechaCorte(modo, fechaParam);
    const fechaInicio = getFechaInicioMesDe(fechaCorte);
    const fechaFin    = fechaCorte;

    request.input('fechaCorte',  sql.VarChar(8), fechaCorte);
    request.input('fechaInicio', sql.VarChar(8), fechaInicio);
    request.input('fechaFin',    sql.VarChar(8), fechaFin);

    const result = await request.query(`
      SELECT DISTINCT LTRIM(RTRIM(f1_razon_vend_cliente)) AS asesor
      FROM dbo.fn_ti_cartera_con_rem_x_asesor(@fechaCorte, @fechaInicio, @fechaFin)
      WHERE f1_razon_vend_cliente IS NOT NULL
        AND LTRIM(RTRIM(f1_razon_vend_cliente)) <> ''
      ORDER BY asesor
    `);

    return result.recordset.map((r) => r.asesor);

  } catch (error) {
    logger.error('Error en getAsesores:', error);
    throw error;
  }
};

export { getCarteraAsesor, getAsesores };