"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { 
  getCartera, 
  getCarteraHoy, 
  getCarteraPorTercero 
} from "@/lib/services/carteraService"

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

// 🔑 Keys del cache centralizadas
export const carteraKeys = {
  all: ["cartera"] as const,
  corte: () => [...carteraKeys.all, "corte"] as const,
  hoy: () => [...carteraKeys.all, "hoy"] as const,
  tercero: (nit: string) => [...carteraKeys.all, "tercero", nit] as const,
}

// 📥 Hook principal — mantiene la MISMA API que antes
export function useCartera() {
  const query = useQuery({
    queryKey: carteraKeys.corte(),
    queryFn: async () => {
      const response = await getCartera()
      return response.data.data as CarteraItem[]
    },
  })

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? "Error al cargar la cartera" : null,
    isFetching: query.isFetching,  // 🆕 indica refetch en background
    refetch: query.refetch,        // 🆕 forzar refetch manual
  }
}

// 📥 Hook para cartera del día
export function useCarteraHoy() {
  const query = useQuery({
    queryKey: carteraKeys.hoy(),
    queryFn: async () => {
      const response = await getCarteraHoy()
      return response.data.data as CarteraItem[]
    },
  })

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? "Error al cargar la cartera" : null,
    isFetching: query.isFetching,
  }
}

// 📥 Hook por tercero
export function useCarteraPorTercero(tercero: string | null) {
  const query = useQuery({
    queryKey: carteraKeys.tercero(tercero ?? ""),
    queryFn: async () => {
      const response = await getCarteraPorTercero(tercero!)
      return response.data.data as CarteraItem[]
    },
    enabled: !!tercero,
  })

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? "Error al cargar la cartera" : null,
  }
}

// 🔄 Hook para invalidar el cache de cartera
export function useRefrescarCartera() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: carteraKeys.all })
  }
}