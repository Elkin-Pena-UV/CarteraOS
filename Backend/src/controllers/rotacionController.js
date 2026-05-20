import { getRotacion } from '../services/rotacionService.js';
import { parsearFechaCorte, getFechaCorte } from '../utils/fechaUtils.js';

/**
 * GET /cartera/rotacion
 * Query params:
 *   - fechaCorte (opcional): YYYYMMDD o YYYY-MM-DD
 *                            Default: último cierre de mes
 */
const obtenerRotacion = async (req, res) => {
  try {
    const { fechaCorte: fechaParam } = req.query;

    let fechaCorte;
    if (fechaParam) {
      fechaCorte = parsearFechaCorte(fechaParam);
      if (!fechaCorte) {
        return res.status(400).json({
          ok: false,
          message: `fechaCorte inválida: '${fechaParam}'. Use formato YYYYMMDD o YYYY-MM-DD.`,
        });
      }
    } else {
      fechaCorte = getFechaCorte(); // último cierre de mes
    }

    const result = await getRotacion(fechaCorte);

    res.status(200).json({
      ok: true,
      total: result.data.length,
      data: result.data,
      meta: { fechaCorte: result.fechaCorte },
    });
  } catch (error) {
    console.error('Error en obtenerRotacion:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al consultar la rotación de cartera',
      error: error.message,
    });
  }
};

export { obtenerRotacion };