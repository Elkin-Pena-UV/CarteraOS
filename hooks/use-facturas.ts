"use client"

import { useState, useEffect } from "react"
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

export function useFacturas(nit: string | null) {
  const [data, setData] = useState<FacturaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!nit) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getFacturasCliente(nit)
        setData(response.data)
      } catch (err) {
        setError("Error al cargar las facturas")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [nit])

  return { data, loading, error }
}