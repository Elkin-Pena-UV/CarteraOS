// DB CONSTRAINT (applied manually):
// ALTER TABLE ti_cruce_autorizado
//   ADD CONSTRAINT UQ_cruce_autorizado UNIQUE (tercero, clave_tipo, clave_valor);
// This prevents duplicate authorizations at the database level.

import { poolPromise } from '../config/db.js'
import logger from '../config/logger.js'

/**
 * Guarda uno o varios cruces autorizados en ti_cruce_autorizado.
 * @param {Array} cruces   - array de objetos con los campos del cruce
 * @param {string} usuario - username de la sesión
 * @param {string} ip      - IP del request
 */
export async function guardarCrucesAutorizados(cruces, usuario, ip = null) {
  const pool = await poolPromise
  const results = []

  for (const cruce of cruces) {
    const result = await pool.request()
      .input('tercero',          cruce.tercero)
      .input('clave_tipo',       cruce.claveType)
      .input('clave_valor',      cruce.claveValor)
      .input('tipo_cruce',       cruce.tipoCruce)        // 'AUTOMATICO' | 'MANUAL'
      .input('caso',             cruce.caso ?? null)
      .input('confianza',        cruce.confianza)
      .input('total_fve',        cruce.totalFVE)
      .input('total_rc',         cruce.totalRC)
      .input('net_residual',     cruce.net)
      .input('consecs_fve',      cruce.consecsFVE ?? null)
      .input('consecs_rc',       cruce.consecsRC  ?? null)
      .input('nro_fve',          cruce.nroFVE ?? 0)
      .input('nro_rc',           cruce.nroRC  ?? 0)
      .input('autorizado_por',   usuario)
      .input('ip_origen',        ip)
      .input('observaciones',    cruce.observaciones ?? null)
      .query(`
        INSERT INTO ti_cruce_autorizado (
          tercero, clave_tipo, clave_valor, tipo_cruce, caso, confianza,
          total_fve, total_rc, net_residual,
          consecs_fve, consecs_rc, nro_fve, nro_rc,
          autorizado_por, ip_origen, observaciones
        )
        OUTPUT INSERTED.id, INSERTED.fecha_autorizacion
        VALUES (
          @tercero, @clave_tipo, @clave_valor, @tipo_cruce, @caso, @confianza,
          @total_fve, @total_rc, @net_residual,
          @consecs_fve, @consecs_rc, @nro_fve, @nro_rc,
          @autorizado_por, @ip_origen, @observaciones
        )
      `)

    results.push({
      ...cruce,
      id:                 result.recordset[0].id,
      fechaAutorizacion:  result.recordset[0].fecha_autorizacion,
    })
  }

  logger.info(`[cruceAutorizar] ${results.length} cruces guardados por ${usuario}`)
  return results
}

/**
 * Devuelve el historial de cruces autorizados con filtros opcionales.
 */
export async function obtenerHistorialCruces({ tercero, desde, hasta, tipo, usuario } = {}) {
  const pool = await poolPromise
  const req  = pool.request()

  let where = 'WHERE estado = \'AUTORIZADO\''
  if (tercero) { req.input('tercero', tercero); where += ' AND tercero = @tercero' }
  if (desde)   { req.input('desde',   desde);   where += ' AND fecha_autorizacion >= @desde' }
  if (hasta)   { req.input('hasta',   hasta);   where += ' AND fecha_autorizacion <= @hasta' }
  if (tipo)    { req.input('tipo',    tipo);    where += ' AND tipo_cruce = @tipo' }
  if (usuario) { req.input('usuario', usuario); where += ' AND autorizado_por = @usuario' }

  const result = await req.query(`
    SELECT
      id, tercero, clave_tipo, clave_valor,
      tipo_cruce, caso, confianza,
      total_fve, total_rc, net_residual,
      consecs_fve, consecs_rc, nro_fve, nro_rc,
      autorizado_por, fecha_autorizacion, observaciones
    FROM ti_cruce_autorizado
    ${where}
    ORDER BY fecha_autorizacion DESC
  `)

  return result.recordset
}

/**
 * Checks whether any of the given cruces already exist in ti_cruce_autorizado.
 * Returns the records found (empty array = none exist).
 * @param {Array} cruces - array with { tercero, claveType, claveValor }
 */
export async function verificarCrucesExistentes(cruces) {
  const pool = await poolPromise
  const duplicados = []

  for (const c of cruces) {
    const r = await pool.request()
      .input('tercero',    c.tercero)
      .input('clave_tipo', c.claveType)
      .input('clave_valor', c.claveValor)
      .query(`
        SELECT TOP 1
          tercero, clave_tipo, clave_valor,
          autorizado_por, fecha_autorizacion
        FROM ti_cruce_autorizado
        WHERE tercero     = @tercero
          AND clave_tipo  = @clave_tipo
          AND clave_valor = @clave_valor
      `)

    if (r.recordset.length > 0) {
      duplicados.push({
        tercero:            r.recordset[0].tercero,
        clave_tipo:         r.recordset[0].clave_tipo,
        clave_valor:        r.recordset[0].clave_valor,
        autorizado_por:     r.recordset[0].autorizado_por,
        fecha_autorizacion: r.recordset[0].fecha_autorizacion,
      })
    }
  }

  return duplicados
}