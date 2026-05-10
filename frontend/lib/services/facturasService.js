import api from "@/lib/axios"

export const getFacturasCliente = async (nit, page = 1, limit = 50) => {
  return await api.get("/facturas", { 
    params: { nit, page, limit } 
  })
}