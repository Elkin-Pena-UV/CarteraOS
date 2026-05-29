"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getRotacion, type RotacionFiltros } from "@/lib/services/rotacionService"

export type RotacionItem = {
  periodo: string
  cartera: number
  ventaBruta: number
  rebate: number
  ventaNeta: number
  promedioVentas3m: number
  acumuladoVenta12m: number
  rotCxC: number
  rotCxCMensual: number
}

export type RotacionCliente = {
  f1_tercero: string
  f1_tercero_razon_social: string
  f1_id_cond_pago: string
  f1_canal: string
}

export const rotacionKeys = {
  all: ["rotacion"] as const,
  byFecha: (fechaRef: string | null, filtros: RotacionFiltros) =>
    [...rotacionKeys.all, fechaRef ?? "default", filtros] as const,
}

export function useRotacion(
  fechaRef: string | null = null,
  filtros: RotacionFiltros = {}
) {
  const query = useQuery({
    queryKey: rotacionKeys.byFecha(fechaRef, filtros),
    queryFn: async () => {
      const response = await getRotacion(fechaRef, filtros) as unknown as {
        ok: boolean
        data: RotacionItem[]
        clientes: RotacionCliente[]
      }
      return { data: response.data ?? [], clientes: response.clientes ?? [] }
    },
  })

  return {
    data: query.data?.data ?? [],
    clientes: query.data?.clientes ?? [],
    loading: query.isLoading,
    error: query.error ? "Error al cargar la rotación de cartera" : null,
    isFetching: query.isFetching,
    refetch: query.refetch,
  }
}

export function useRefrescarRotacion() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: rotacionKeys.all })
  }
}