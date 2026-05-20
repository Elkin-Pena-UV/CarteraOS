"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getRotacion } from "@/lib/services/rotacionService"

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
  byFecha: (fechaRef: string | null) =>
    [...rotacionKeys.all, fechaRef ?? "default"] as const,
}

export function useRotacion(fechaRef: string | null = null) {
  const query = useQuery({
    queryKey: rotacionKeys.byFecha(fechaRef),
    queryFn: async () => {
      const response = await getRotacion(fechaRef) as unknown as {
        ok: boolean
        data: RotacionItem[]
      }
      return response.data ?? []
    },
    // Sin enabled — null es válido, el backend responde con el cierre por defecto
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