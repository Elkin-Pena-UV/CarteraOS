import type { VariacionItem } from "@/hooks/use-variacion"
import type { VariationClient } from "@/components/cartera/variation-table"

export function adaptVariacionToClients(data: VariacionItem[]): VariationClient[] {
  return data.map((item, index) => ({
    id: String(index),
    nit: item.f1_tercero.trim(),
    razonSocial: item.f1_tercero_razon_social,
    tipoCliente: item.f1_desc_tipo_cliente,
    canal: item.f1_canal,
    cupo: item.f1_cupo ?? 0,
    carteraMesActual: item.f1_saldo_total ?? 0,
    carteraUltimoMes: item.f1_saldo_mes_anterior ?? 0,
    variacionCop: item.f1_variacion_valor ?? 0,
    variacionPct: item.f1_variacion_pct ?? 0,
    viaje: item.f1_viaje ?? 0,
    sobrecupoCop: item.f1_sobrecupo ?? 0,
  }))
}