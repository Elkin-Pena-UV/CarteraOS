"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getCartera, getCarteraPorTercero } from "@/lib/services/carteraService"

export type CarteraItem = {
  f1_tercero: string
  f1_tercero_razon_social: string
  f1_id_cond_pago: string
  f1_asesor: string
  f_02_02: string
  f1_cupo: number
  f1_saldo_corriente_total: number
  f1_saldo_vencido1: number
  f1_saldo_vencido2: number
  f1_saldo_vencido3: number
  f1_saldo_vencido4: number
  f1_saldo_vencido_total: number
  f1_saldo_total: number
  f1_total_cop: number
  f1_fecha_vcto_min: string
  f1_fecha_vcto_max: string
  f_rem_valor_neto_total: number
  f_rem_peso_total: number
  f_rem_cantidad_documentos: number
}

export type ModoFechaCorte = 'hoy' | 'fecha'

// 🔑 Cache keys — incluyen modo y fechaCorte para que cada combinación tenga su propia entrada
export const carteraKeys = {
  all: ["cartera"] as const,
  byModo: (modo: ModoFechaCorte, fecha?: string) =>
    [...carteraKeys.all, modo, fecha ?? ""] as const,
  tercero: (nit: string) => [...carteraKeys.all, "tercero", nit] as const,
}

// 📥 Hook principal — recibe modo y fecha de corte seleccionados por el usuario
export function useCartera(modo: ModoFechaCorte = 'hoy', fechaCorte?: string) {
  const query = useQuery({
    queryKey: carteraKeys.byModo(modo, fechaCorte),
    queryFn: async () => {
      // El interceptor de axios ya extrae response.data,
      // así que 'response' ES el body: { ok, total, data, meta }
      const response = await getCartera(
        modo,
        modo === 'fecha' ? (fechaCorte ?? null) : null
      ) as unknown as { ok: boolean; data: CarteraItem[] }
      return response.data ?? []
    },
    // Solo habilitar modo='fecha' si hay fecha seleccionada
    enabled: modo !== 'fecha' || !!fechaCorte,
  })

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? "Error al cargar la cartera" : null,
    isFetching: query.isFetching,
    refetch: query.refetch,
  }
}

// 📥 Hook por tercero
export function useCarteraPorTercero(tercero: string | null) {
  const query = useQuery({
    queryKey: carteraKeys.tercero(tercero ?? ""),
    queryFn: async () => {
      const response = await getCarteraPorTercero(tercero!) as unknown as { ok: boolean; data: CarteraItem[] }
      return response.data ?? []
    },
    enabled: !!tercero,
  })

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? "Error al cargar la cartera" : null,
  }
}

// 🔄 Hook para invalidar todo el cache de cartera
export function useRefrescarCartera() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: carteraKeys.all })
  }
}