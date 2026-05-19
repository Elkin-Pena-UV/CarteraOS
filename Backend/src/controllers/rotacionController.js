import { getRotacion } from '../services/rotacionService.js';
import { parsearFechaCorte, getFechaCorte } from '../utils/fechaUtils.js';

/**
 * GET /rotacion
 * Query params:
 *   - fechaRef (opcional): YYYYMMDD o YYYY-MM-DD
 *     Define el último periodo de la serie. Si se omite,
 *     se usa el último cierre de mes (mes anterior al actual).
 */
const obtenerRotacion = async (req, res) => {
  try {
    const { fechaRef: fechaParam } = req.query;

    let fechaRef;
    if (fechaParam) {
      fechaRef = parsearFechaCorte(fechaParam);
      if (!fechaRef) {
        return res.status(400).json({
          ok: false,
          message: `fechaRef inválida: '${fechaParam}'. Use formato YYYYMMDD o YYYY-MM-DD.`,
        });
      }
    } else {
      fechaRef = getFechaCorte(); // último día del mes anterior
    }

    const result = await getRotacion(fechaRef);

    res.status(200).json({
      ok: true,
      total: result.data.length,
      data: result.data,
      meta: {
        fechaRef: result.fechaRef,
        periodos: result.periodos,
      },
    });
  } catch (error) {
    console.error('Error en obtenerRotacion:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al consultar la rotación',
      error: error.message,
    });
  }
};

export { obtenerRotacion };