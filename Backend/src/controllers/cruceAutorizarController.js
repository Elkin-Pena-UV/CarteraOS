import {
  guardarCrucesAutorizados,
  obtenerHistorialCruces,
} from '../services/cruceAutorizarService.js'

/**
 * POST /api/cruce-aut/autorizar
 * Body: { cruces: [...], tipoCruce: 'AUTOMATICO'|'MANUAL', observaciones? }
 */
export async function autorizarCruces(req, res) {
  try {
    const { cruces, observaciones } = req.body

    if (!Array.isArray(cruces) || cruces.length === 0) {
      return res.status(400).json({ ok: false, error: 'Se requiere al menos un cruce' })
    }

    // Usuario de la sesión (ajusta según tu sistema de auth)
    const usuario = req.user?.username ?? req.user?.nombre ?? req.user?.email ?? 'desconocido'
    const ip      = req.ip ?? req.headers['x-forwarded-for'] ?? null

    // Inyectar observaciones si vienen globales
    const crucesConObs = cruces.map(c => ({
      ...c,
      observaciones: c.observaciones ?? observaciones ?? null,
    }))

    const guardados = await guardarCrucesAutorizados(crucesConObs, usuario, ip)

    return res.json({
      ok:        true,
      guardados: guardados.length,
      cruces:    guardados,
    })
  } catch (err) {
    console.error('[autorizarCruces]', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
}

/**
 * GET /api/cruce-aut/historial
 * Query params: tercero, desde, hasta, tipo
 */
export async function historialCruces(req, res) {
  try {
    const { tercero, desde, hasta, tipo, usuario } = req.query
    const historial = await obtenerHistorialCruces({ tercero, desde, hasta, tipo, usuario })
    return res.json({ ok: true, total: historial.length, data: historial })
  } catch (err) {
    console.error('[historialCruces]', err)
    return res.status(500).json({ ok: false, error: err.message })
  }
}