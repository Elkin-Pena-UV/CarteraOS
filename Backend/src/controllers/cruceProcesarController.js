// Backend/src/controllers/cruceProcesarController.js
import { procesarCruces, escribirPlanos } from '../services/cruceProcesarService.js';

/**
 * POST /api/cruce-aut/procesar
 * Body/query opcional: { escribir: true } para volcar los planos a disco.
 */
const procesarCrucesCtrl = async (req, res) => {
  try {
    const escribir = req.body?.escribir === true || req.query?.escribir === 'true';

    const { resumen, procesados, gruposManuales, revision } = await procesarCruces();

    let escritos;
    if (escribir) {
      const dir = process.env.CRUCES_OUTPUT_DIR || './planos-cruces';
      escritos = await escribirPlanos(procesados, dir);
    }

    res.status(200).json({
      ok: true,
      resumen,
      procesados,
      gruposManuales,
      revision,
      ...(escritos ? { escritos } : {}),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al procesar cruces',
      error: error.message,
    });
  }
};

export { procesarCrucesCtrl };