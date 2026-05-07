import api from "@/lib/axios"

export const getFacturasCliente = async (nit) => {
  return await api.get("/facturas", { params: { nit } })
}