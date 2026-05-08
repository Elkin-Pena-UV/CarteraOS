"use client"

import { useQuery } from "@tanstack/react-query"
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

export const facturasKeys = {
  all: ["facturas"] as const,
  porCliente: (nit: string) => [...facturasKeys.all, "cliente", nit] as const,
}

export function useFacturas(nit: string | null) {
  const query = useQuery({
    queryKey: facturasKeys.porCliente(nit ?? ""),
    queryFn: async () => {
      const response = await getFacturasCliente(nit!)
      return response.data as FacturaItem[]
    },
    enabled: !!nit,  // 🚫 No ejecuta si nit es null/vacío
  })

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? "Error al cargar las facturas" : null,
  }
}