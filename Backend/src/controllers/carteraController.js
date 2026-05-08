import { getCartera } from '../services/carteraService.js';

/**
 * GET /cartera
 * Query params:
 *   - modo     (opcional): 'corte' o 'hoy'  → si no se envía, usa 'corte'
 *   - tercero  (opcional): NIT del tercero
 */
const obtenerCartera = async (req, res) => {
  try {
    const { tercero, modo } = req.query;
    const data = await getCartera(modo || 'corte', tercero || null);
    res.status(200).json({ ok: true, total: data.length, data });
  } catch (error) {
    console.error('Error en obtenerCartera:', error);
    res.status(500).json({ ok: false, message: 'Error al consultar la cartera', error: error.message });
  }
};

export { obtenerCartera };