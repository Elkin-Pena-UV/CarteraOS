import api from '@/lib/axios';
import type { ModoFechaCorte } from '@/hooks/use-cartera';

/**
 * Mismos parámetros que carteraService + asesores opcional.
 */
export const getCarteraAsesor = async (
  modo: ModoFechaCorte = 'hoy',
  fechaCorte: string | null = null,
  asesores: string[] | null = null,
) => {
  const params: Record<string, string | string[]> = { modo };
  if (modo === 'fecha' && fechaCorte) params.fechaCorte = fechaCorte;
  if (asesores && asesores.length > 0) params.asesor = asesores;
  return await api.get('/cartera-asesor', { params });
};

export const getAsesoresDisponibles = async (
  modo: ModoFechaCorte = 'hoy',
  fechaCorte: string | null = null,
) => {
  const params: Record<string, string> = { modo };
  if (modo === 'fecha' && fechaCorte) params.fechaCorte = fechaCorte;
  return await api.get('/cartera-asesor/asesores', { params });
};

export const refrescarCarteraAsesorBackend = async (
  modo: ModoFechaCorte = 'hoy',
  fechaCorte: string | null = null,
  asesores: string[] | null = null,
) => {
  const params: Record<string, string | string[]> = { modo };
  if (modo === 'fecha' && fechaCorte) params.fechaCorte = fechaCorte;
  if (asesores && asesores.length > 0) params.asesor = asesores;
  return await api.post('/cartera-asesor/refrescar', {}, { params });
};