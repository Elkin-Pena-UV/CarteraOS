"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getVariacion } from "@/lib/services/variacionService"

export type VariacionItem = {
  f1_tercero: string
  f1_tercero_razon_social: string
  f1_desc_tipo_cliente: string
  f1_cupo: number
  f1_canal: string
  f1_saldo_total: number
  f1_saldo_mes_anterior: number
  f1_variacion_valor: number
  f1_variacion_pct: number
  f1_viaje: number
  f1_sobrecupo: number
}

export const variacionKeys = {
  all: ["variacion"] as const,
  byFecha: (fecha: string) => [...variacionKeys.all, fecha] as const,
}

export function useVariacion(fecha: string) {
  const query = useQuery({
    queryKey: variacionKeys.byFecha(fecha),
    queryFn: async () => {
      const response = await getVariacion(fecha) as unknown as {
        ok: boolean
        data: VariacionItem[]
      }
      return response.data ?? []
    },
    enabled: !!fecha,
  })

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? "Error al cargar la variación de cartera" : null,
    isFetching: query.isFetching,
    refetch: query.refetch,
  }
}

export function useRefrescarVariacion() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: variacionKeys.all })
  }
}