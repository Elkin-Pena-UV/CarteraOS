import api from '@/lib/axios';

export interface RotacionFiltros {
  canal?: string[]
  condPago?: string[]
  razonSocial?: string
}

/**
 * Consulta la tabla de rotación de cartera de los últimos 12 periodos.
 *
 * @param {string | null} fechaCorte - Último día del periodo de referencia en formato YYYYMMDD.
 *   Si se omite, el backend usa el último cierre de mes (mes anterior al actual).
 * @param {RotacionFiltros} filtros - Filtros opcionales de canal, condición de pago y cliente.
 */
export const getRotacion = async (
  fechaCorte: string | null = null,
  filtros: RotacionFiltros = {}
) => {
  const params: Record<string, string> = {};
  if (fechaCorte)                params.fechaCorte    = fechaCorte;
  if (filtros.canal?.length)     params.canal         = filtros.canal.join(',');
  if (filtros.condPago?.length)  params.condPago      = filtros.condPago.join(',');
  if (filtros.razonSocial?.trim()) params.razonSocial = filtros.razonSocial.trim();
  return await api.get('/rotacion', { params });
};