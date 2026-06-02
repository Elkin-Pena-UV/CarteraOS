// Backend/src/controllers/cruceProcesarController.js
import { procesarCruces } from '../services/cruceProcesarService.js';

/**
 * POST /api/cruce-aut/procesar
 *
 * Flags en el body (todos opcionales, combinables):
 *   { "generar": true }   → llama /generar-plano para verificar antes de importar
 *   { "enviar": true }    → llama /importar (importación definitiva)
 *   { "escribir": true }  → vuelca los planos a disco
 */
const procesarCrucesCtrl = async (req, res) => {
  try {
    const generar  = req.body?.generar  === true || req.query?.generar  === 'true';
    const enviar   = req.body?.enviar   === true || req.query?.enviar   === 'true';
    const escribir = req.body?.escribir === true || req.query?.escribir === 'true';
    const muestraPorCaso = req.body?.muestraPorCaso === true || req.query?.muestraPorCaso === 'true';

    const resultado = await procesarCruces({ generar, enviar, escribir, muestraPorCaso });

    res.status(200).json({ ok: true, ...resultado });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al procesar cruces',
      error: error.message,
    });
  }
};

export { procesarCrucesCtrl };