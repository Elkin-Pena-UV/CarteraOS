import { getFacturasCliente } from '../services/facturasService.js';

const obtenerFacturasCliente = async (req, res) => {
  try {
    const { nit } = req.query;

    if (!nit) {
      return res.status(400).json({ ok: false, message: 'El NIT del cliente es requerido' });
    }

    const data = await getFacturasCliente(nit);
    res.status(200).json({ ok: true, total: data.length, data });
  } catch (error) {
    console.error('Error en obtenerFacturasCliente:', error);
    res.status(500).json({ ok: false, message: 'Error al consultar las facturas', error: error.message });
  }
};

export { obtenerFacturasCliente };