"use client"

import { useState, useEffect } from "react"
import { getCartera } from "@/lib/services/carteraService"

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

export function useCartera() {
  const [data, setData] = useState<CarteraItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getCartera()
        setData(response.data)
      } catch (err) {
        setError("Error al cargar la cartera")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}