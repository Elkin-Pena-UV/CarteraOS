import api from '@/lib/axios';

/**
 * Consulta la cartera según el modo de fecha de corte.
 *
 * @param {'hoy' | 'corte' | 'fecha'} modo   - Default: 'hoy'
 * @param {string | null}              fechaCorte - Requerido si modo='fecha', formato YYYYMMDD
 * @param {string | null}              tercero    - NIT del tercero (opcional)
 */
export const getCartera = async (modo = 'hoy', fechaCorte = null, tercero = null) => {
  const params = { modo };
  if (modo === 'fecha' && fechaCorte) params.fechaCorte = fechaCorte;
  if (tercero) params.tercero = tercero;
  return await api.get('/cartera', { params });
};

// Aliases de conveniencia
export const getCarteraHoy   = ()       => getCartera('hoy');
export const getCarteraFecha = (fecha)  => getCartera('fecha', fecha);

export const getCarteraPorTercero = (tercero) => getCartera('hoy', null, tercero);