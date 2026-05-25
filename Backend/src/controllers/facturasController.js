import { getFacturasCliente } from '../services/facturasService.js';

const obtenerFacturasCliente = async (req, res) => {
  try {
    const { nit, page, limit, fechaCorte } = req.query;

    if (!nit) {
      return res.status(400).json({ 
        ok: false, 
        message: 'El NIT del cliente es requerido' 
      });
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));

    const result = await getFacturasCliente(nit, pageNum, limitNum, fechaCorte ?? null);

    res.status(200).json({ 
      ok: true, 
      ...result
    });

  } catch (error) {
    console.error('Error en obtenerFacturasCliente:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Error al consultar las facturas', 
      error: error.message 
    });
  }
};

export { obtenerFacturasCliente };