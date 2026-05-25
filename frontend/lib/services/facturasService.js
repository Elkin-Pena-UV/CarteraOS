import api from "@/lib/axios"

/**
 * @param {string} nit
 * @param {number} [page]
 * @param {number} [limit]
 * @param {string | null} [fechaCorte]
 */
export const getFacturasCliente = async (nit, page = 1, limit = 50, fechaCorte = null) => {
  const params = { nit, page, limit }
  if (fechaCorte) params.fechaCorte = fechaCorte
  return await api.get("/facturas", { params })
}