import { getCartera } from '../services/carteraService.js';
import { invalidateCache } from '../middleware/cacheMiddleware.js';
import { parsearFechaCorte } from '../utils/fechaUtils.js';

/**
 * GET /cartera
 * Query params:
 *   - modo       (opcional): 'hoy' | 'corte' | 'fecha'  → default: 'hoy'
 *   - fechaCorte (requerido si modo='fecha'): YYYYMMDD o YYYY-MM-DD
 *   - tercero    (opcional): NIT del tercero
 */
const obtenerCartera = async (req, res) => {
  try {
    const { tercero, modo = 'hoy', fechaCorte: fechaParam } = req.query;

    // Validar modo
    const modosValidos = ['hoy', 'corte', 'fecha'];
    if (!modosValidos.includes(modo)) {
      return res.status(400).json({
        ok: false,
        message: `Modo inválido: '${modo}'. Valores permitidos: ${modosValidos.join(', ')}`,
      });
    }

    // Validar fechaCorte cuando modo='fecha'
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

    const result = await getCartera(modo, tercero || null, fechaCorteResuelta);

    res.status(200).json({
      ok: true,
      total: result.data.length,
      data: result.data,
      meta: {
        modo,
        fechaCorte: result.fechaCorte,
        fechaInicio: result.fechaInicio,
      },
    });
  } catch (error) {
    console.error('Error en obtenerCartera:', error);
    res.status(500).json({ ok: false, message: 'Error al consultar la cartera', error: error.message });
  }
};

/**
 * POST /cartera/refrescar
 * Invalida el cache y vuelve a consultar.
 * Acepta los mismos query params que GET /cartera.
 */
const refrescarCartera = async (req, res) => {
  try {
    invalidateCache('cartera');

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

    const result = await getCartera(modo, tercero || null, fechaCorteResuelta);

    res.status(200).json({
      ok: true,
      total: result.data.length,
      data: result.data,
      message: 'Datos refrescados desde la base de datos',
      meta: {
        modo,
        fechaCorte: result.fechaCorte,
        fechaInicio: result.fechaInicio,
      },
    });
  } catch (error) {
    console.error('Error en refrescarCartera:', error);
    res.status(500).json({ ok: false, message: 'Error al refrescar', error: error.message });
  }
};

export { obtenerCartera, refrescarCartera };