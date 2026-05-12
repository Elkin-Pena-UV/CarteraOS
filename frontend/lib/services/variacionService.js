import api from '@/lib/axios';

/**
 * Consulta la variación de cartera para una fecha dada.
 * @param fecha - Formato YYYYMMDD (ej: '20260508')
 */
export const getVariacion = async (fecha) => {
  return await api.get('/variacion', { params: { fecha } });
};