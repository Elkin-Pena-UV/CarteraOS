import { getVariacion } from '../services/variacionService.js';
import { parsearFechaCorte } from '../utils/fechaUtils.js';

/**
 * GET /cartera/variacion
 * Query params:
 *   - fecha (requerido): YYYYMMDD o YYYY-MM-DD
 */
const obtenerVariacion = async (req, res) => {
  try {
    const { fecha: fechaParam } = req.query;

    if (!fechaParam) {
      return res.status(400).json({
        ok: false,
        message: "El parámetro 'fecha' es requerido. Use formato YYYYMMDD o YYYY-MM-DD.",
      });
    }

    const fecha = parsearFechaCorte(fechaParam);
    if (!fecha) {
      return res.status(400).json({
        ok: false,
        message: `Fecha inválida: '${fechaParam}'. Use formato YYYYMMDD o YYYY-MM-DD.`,
      });
    }

    const result = await getVariacion(fecha);

    res.status(200).json({
      ok: true,
      total: result.data.length,
      data: result.data,
      meta: { fecha: result.fecha },
    });

  } catch (error) {
    console.error('Error en obtenerVariacion:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al consultar la variación de cartera',
      error: error.message,
    });
  }
};

export { obtenerVariacion };