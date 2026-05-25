"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { getFacturasCliente } from "@/lib/services/facturasService"

export type FacturaItem = {
  f1_auxiliar: string
  f1_tercero: string
  f1_tercero_razon_social: string
  f1_docto_causacion: string
  f1_co: string
  f1_saldo_corriente_total: number
  f1_saldo_vencido1: number
  f1_saldo_vencido2: number
  f1_saldo_vencido3: number
  f1_saldo_vencido4: number
  f1_saldo_vencido_total: number
  f1_saldo_total: number
}

export type PaginationMeta = {
  total: number
  page: number
  limit: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

export const facturasKeys = {
  all: ["facturas"] as const,
  porCliente: (nit: string, page: number, limit: number) =>
    [...facturasKeys.all, "cliente", nit, page, limit] as const,
}

export function useFacturas(nit: string | null, page: number = 1, limit: number = 50, fechaCorte?: string | null | undefined) {
  const query = useQuery({
    queryKey: [...facturasKeys.porCliente(nit ?? "", page, limit), fechaCorte ?? "hoy"],
    queryFn: async () => {
      const fecha: string | null = fechaCorte ?? null
      // El interceptor de axios ya devuelve response.data,
      // pero TS infiere AxiosResponse. Casteamos vía unknown.
      const response = (await getFacturasCliente(nit!, page, limit, fecha)) as unknown as {
        ok: boolean
        data: FacturaItem[]
        pagination: PaginationMeta
      }
      return response
    },
    enabled: !!nit,
    // 🎯 Clave para paginación fluida:
    // Mientras carga la página nueva, sigue mostrando la anterior
    // (sin parpadeo / sin mostrar "Cargando...")
    placeholderData: keepPreviousData,
  })

  return {
    data: query.data?.data ?? [],
    pagination: query.data?.pagination,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? "Error al cargar las facturas" : null,
  }
}