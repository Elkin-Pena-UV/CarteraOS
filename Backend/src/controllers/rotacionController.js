import { getRotacion } from '../services/rotacionService.js';
import { parsearFechaCorte, getFechaCorte } from '../utils/fechaUtils.js';

const obtenerRotacion = async (req, res) => {
  try {
    const { fechaCorte: fechaParam, canal, condPago, razonSocial } = req.query;

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
      fechaCorte = getFechaCorte();
    }

    // canal y condPago pueden venir como "A,B" o como array (qs con repeated params)
    const parseLista = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.filter(Boolean);
      return val.split(',').map(s => s.trim()).filter(Boolean);
    };

    const filtros = {
      canal:       parseLista(canal),
      condPago:    parseLista(condPago),
      razonSocial: razonSocial?.trim() ?? '',
    };

    const result = await getRotacion(fechaCorte, filtros);

    res.status(200).json({
      ok:       true,
      total:    result.data.length,
      data:     result.data,
      clientes: result.clientes,
      meta: {
        fechaCorte: result.fechaCorte,
        filtros,
      },
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