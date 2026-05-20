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
      }
      return response.data ?? []
    },
  })

  return {
    data: query.data ?? [],
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