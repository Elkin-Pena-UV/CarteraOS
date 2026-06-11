import { getCarteraAsesor, getAsesores } from '../services/carteraAsesorService.js';
import { invalidateCache } from '../middleware/cacheMiddleware.js';
import { parsearFechaCorte } from '../utils/fechaUtils.js';

// Misma normalización de asesores que antes
const normalizarAsesores = (raw) => {
  if (raw === undefined || raw === null || raw === '') return null;
  const arr    = Array.isArray(raw) ? raw : [raw];
  const limpio = arr.map((a) => String(a).trim()).filter(Boolean);
  return limpio.length > 0 ? limpio : null;
};

/**
 * GET /api/cartera-asesor
 * Mismos query params que /api/cartera:
 *   - modo       (opcional): 'hoy' | 'corte' | 'fecha'  → default: 'hoy'
 *   - fechaCorte (requerido si modo='fecha'): YYYYMMDD o YYYY-MM-DD
 *   - tercero    (opcional): NIT del tercero
 * Más el param propio:
 *   - asesor     (opcional, repetible): ?asesor=X&asesor=Y
 */
const obtenerCarteraAsesor = async (req, res) => {
  try {
    const { tercero, modo = 'hoy', fechaCorte: fechaParam } = req.query;

    const modosValidos = ['hoy', 'corte', 'fecha'];
    if (!modosValidos.includes(modo)) {
      return res.status(400).json({
        ok: false,
        message: `Modo inválido: '${modo}'. Valores permitidos: ${modosValidos.join(', ')}`,
      });
    }

    let fechaCorteResuelta = null;
    if (modo === 'fecha') {
      fechaCorteResuelta = parsearFechaCorte(fechaParam);
      if (!fechaCorteResuelta) {
        return res.status(400).json({
          ok: false,
          message: `fechaCorte inválida: '${fechaParam}'. Use formato YYYYMMDD o YYYY-MM-DD.`,
        });
      }
    }

    const asesores = normalizarAsesores(req.query.asesor);
    const result   = await getCarteraAsesor(modo, tercero || null, fechaCorteResuelta, asesores);

    res.status(200).json({
      ok:    true,
      total: result.data.length,
      data:  result.data,
      meta:  {
        modo,
        fechaCorte:  result.fechaCorte,
        fechaInicio: result.fechaInicio,
        asesores,
      },
    });
  } catch (error) {
    console.error('Error en obtenerCarteraAsesor:', error);
    res.status(500).json({ ok: false, message: 'Error al consultar cartera x asesor', error: error.message });
  }
};

/**
 * POST /api/cartera-asesor/refrescar
 * Mismos params que el GET.
 */
const refrescarCarteraAsesor = async (req, res) => {
  try {
    invalidateCache('cartera-asesor');

    const { tercero, modo = 'hoy', fechaCorte: fechaParam } = req.query;

    let fechaCorteResuelta = null;
    if (modo === 'fecha') {
      fechaCorteResuelta = parsearFechaCorte(fechaParam);
      if (!fechaCorteResuelta) {
        return res.status(400).json({
          ok: false,
          message: `fechaCorte inválida: '${fechaParam}'. Use formato YYYYMMDD o YYYY-MM-DD.`,
        });
      }
    }

    const asesores = normalizarAsesores(req.query.asesor);
    const result   = await getCarteraAsesor(modo, tercero || null, fechaCorteResuelta, asesores);

    res.status(200).json({
      ok:      true,
      total:   result.data.length,
      data:    result.data,
      message: 'Datos refrescados desde la base de datos',
      meta:    {
        modo,
        fechaCorte:  result.fechaCorte,
        fechaInicio: result.fechaInicio,
        asesores,
      },
    });
  } catch (error) {
    console.error('Error en refrescarCarteraAsesor:', error);
    res.status(500).json({ ok: false, message: 'Error al refrescar cartera x asesor', error: error.message });
  }
};

/**
 * GET /api/cartera-asesor/asesores
 * Mismos params de fecha que el GET principal.
 */
const obtenerAsesores = async (req, res) => {
  try {
    const { modo = 'hoy', fechaCorte: fechaParam } = req.query;

    const modosValidos = ['hoy', 'corte', 'fecha'];
    if (!modosValidos.includes(modo)) {
      return res.status(400).json({
        ok: false,
        message: `Modo inválido: '${modo}'. Valores permitidos: ${modosValidos.join(', ')}`,
      });
    }

    let fechaCorteResuelta = null;
    if (modo === 'fecha') {
      fechaCorteResuelta = parsearFechaCorte(fechaParam);
      if (!fechaCorteResuelta) {
        return res.status(400).json({
          ok: false,
          message: `fechaCorte inválida: '${fechaParam}'. Use formato YYYYMMDD o YYYY-MM-DD.`,
        });
      }
    }

    const asesores = await getAsesores(modo, fechaCorteResuelta);

    res.status(200).json({
      ok:    true,
      total: asesores.length,
      data:  asesores,
    });
  } catch (error) {
    console.error('Error en obtenerAsesores:', error);
    res.status(500).json({ ok: false, message: 'Error al obtener asesores', error: error.message });
  }
};

export { obtenerCarteraAsesor, refrescarCarteraAsesor, obtenerAsesores };