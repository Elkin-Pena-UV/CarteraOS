import api from '@/lib/axios';

export const getCartera = async () => {
  return await api.get('/cartera');
};

export const getCarteraHoy = async () => {
  return await api.get('/cartera', { params: { modo: 'hoy' } });
};

export const getCarteraPorTercero = async (tercero) => {
  return await api.get('/cartera', { params: { tercero } });
};