import api from '@/lib/axios';

/**
 * Consulta la tabla de rotación de cartera de los últimos 12 periodos.
 *
 * @param {string | null} fechaCorte - Último día del periodo de referencia en formato YYYYMMDD.
 *   Si se omite, el backend usa el último cierre de mes (mes anterior al actual).
 */
export const getRotacion = async (fechaCorte: string | null = null) => {
  const params: Record<string, string> = {};
  if (fechaCorte) params.fechaCorte = fechaCorte;
  return await api.get('/rotacion', { params });
};