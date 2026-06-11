"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getCarteraAsesor,
  getAsesoresDisponibles,
} from "@/lib/services/carteraAsesorService"
import type { ModoFechaCorte, CarteraItem } from "@/hooks/use-cartera"

// CarteraAsesorItem es idéntico a CarteraItem — misma estructura de salida
export type CarteraAsesorItem = CarteraItem

// ── Cache keys ────────────────────────────────────────────────────────────────
export const carteraAsesorKeys = {
  all: ["cartera-asesor"] as const,

  lista: (modo: ModoFechaCorte, fecha: string | undefined, asesores: string[]) =>
    [...carteraAsesorKeys.all, "lista", modo, fecha ?? "", asesores] as const,

  asesores: (modo: ModoFechaCorte, fecha: string | undefined) =>
    [...carteraAsesorKeys.all, "asesores", modo, fecha ?? ""] as const,
}

// ── Hook principal ────────────────────────────────────────────────────────────
export function useCarteraAsesor(
  modo: ModoFechaCorte = 'hoy',
  fechaCorte?: string,
  asesores: string[] = [],
) {
  const query = useQuery({
    queryKey: carteraAsesorKeys.lista(modo, fechaCorte, asesores),
    queryFn: async () => {
      const response = await getCarteraAsesor(
        modo,
        modo === 'fecha' ? (fechaCorte ?? null) : null,
        asesores.length > 0 ? asesores : null,
      ) as unknown as { ok: boolean; data: CarteraAsesorItem[] }
      return response.data ?? []
    },
    enabled: modo !== 'fecha' || !!fechaCorte,
  })

  return {
    data:       query.data ?? [],
    loading:    query.isLoading,
    error:      query.error ? "Error al cargar la cartera por asesor" : null,
    isFetching: query.isFetching,
    refetch:    query.refetch,
  }
}

// ── Hook lista de asesores ────────────────────────────────────────────────────
export function useAsesoresDisponibles(
  modo: ModoFechaCorte = 'hoy',
  fechaCorte?: string,
) {
  const query = useQuery({
    queryKey: carteraAsesorKeys.asesores(modo, fechaCorte),
    queryFn: async () => {
      const response = await getAsesoresDisponibles(
        modo,
        modo === 'fecha' ? (fechaCorte ?? null) : null,
      ) as unknown as { ok: boolean; data: string[] }
      return response.data ?? []
    },
    enabled: modo !== 'fecha' || !!fechaCorte,
    staleTime: 1000 * 60 * 60, // 1h
  })

  return {
    asesores: query.data ?? [],
    loading:  query.isLoading,
    error:    query.error ? "Error al cargar asesores" : null,
  }
}

// ── Invalidar todo el módulo ──────────────────────────────────────────────────
export function useRefrescarCarteraAsesor() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: carteraAsesorKeys.all })
}