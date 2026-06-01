import { getCruceAut } from '../services/cruceAutService.js';

const obtenerCruceAut = async (req, res) => {
  try {
    const result = await getCruceAut();

    res.status(200).json({
      ok: true,
      total: result.data.length,
      data: result.data,
      tiempos: result.tiempos,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al consultar cruce aut',
      error: error.message,
    });
  }
};

export { obtenerCruceAut };