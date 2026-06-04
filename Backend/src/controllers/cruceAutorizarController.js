import {
  guardarCrucesAutorizados,
  obtenerHistorialCruces,
} from '../services/cruceAutorizarService.js'
import { enviarAConector } from '../services/cruceProcesarService.js'
import { procesarGrupo } from '../cruces/index.js'
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

    // Para cruces manuales que traen docs pero no doc, generar el doc
    const crucesConDoc = cruces.map(c => {
      if (c.doc) return c   // automáticos ya tienen doc
      if (c.docs?.length > 0) {
        // Re-procesar el grupo para obtener el doc y plano
        const clave = { tipo: c.claveType, valor: c.claveValor, confianza: c.confianza }
        const fechaDoc = c.docs.reduce((maxFecha, d) => {
            return d.fechaDocto > maxFecha ? d.fechaDocto : maxFecha
        }, '')
        const { caso, net, doc, plano } = procesarGrupo(c.docs, clave, fechaDoc)
        return { ...c, caso: caso ?? c.caso, net: net ?? c.net, doc, plano }
      }
      return c   // sin doc, llamarConector lo ignorará
    })

    // 1. Enviar a Siesa PRIMERO
    const conDoc = crucesConDoc.filter(c => c.doc)
    let resultadosSiesa = []

    if (conDoc.length > 0) {
      resultadosSiesa = await enviarAConector(conDoc)
    }

    // 2. Separar exitosos y fallidos
    const exitosos = resultadosSiesa.filter(r => r.ok)
    const fallidos = resultadosSiesa.filter(r => !r.ok)

    // 3. Solo guardar en historial los que Siesa aceptó
    let guardados = []
    if (exitosos.length > 0) {
      // Reconstruir solo los cruces que fueron exitosos en Siesa
        const idsFallidos = new Set(
        fallidos.map(f => `${f.tercero}-${f.clave?.valor ?? ''}`)
        )
        const crucesExitosos = crucesConDoc
        .filter(c => !idsFallidos.has(`${c.tercero}-${c.claveValor}`))
        .map(c => ({
            ...c,
        observaciones: c.observaciones ?? observaciones ?? null,
        }))

        if (crucesExitosos.length > 0) {
        guardados = await guardarCrucesAutorizados(crucesExitosos, usuario, ip)
        }
    }

    // 4. Responder con detalle de exitosos y fallidos
    return res.json({
      ok:            true,
      enviadosSiesa: exitosos.length,
      guardados:     guardados.length,
      fallidos:      fallidos.map(f => ({
        tercero:   f.tercero,
        clave:     f.clave,
        caso:      f.caso,
        status:    f.status,
        error:     f.error ?? JSON.stringify(f.respuesta),
        errores:   f.respuesta?.errors ?? [],
      })),
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