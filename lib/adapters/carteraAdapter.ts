import type { CarteraItem } from "@/hooks/use-cartera"
import type { Client } from "@/components/cartera/clients-table"

const getStatus = (diasVencido: number): Client["status"] => {
  if (diasVencido === 0) return "corriente"
  if (diasVencido <= 60) return "gestion"
  return "vencida"
}

export const adaptCarteraToClients = (items: CarteraItem[]): Client[] => {
  return items.map((item) => ({
    nit: item.f1_tercero,
    name: item.f1_tercero_razon_social,
    advisor: item.f1_asesor,
    channel: item.f_02_02,
    quota: item.f1_cupo,
    current: item.f1_saldo_corriente_total,
    overdue: item.f1_saldo_vencido_total,
    overcapacity: item.f1_saldo_corriente_total + item.f1_saldo_vencido_total - item.f1_cupo,
    maxDaysOverdue: item.f1_fecha_vcto_max ? Math.max(
      item.f1_saldo_vencido1 > 0 ? 30 : 0,
      item.f1_saldo_vencido2 > 0 ? 60 : 0,
      item.f1_saldo_vencido3 > 0 ? 90 : 0,
      item.f1_saldo_vencido4 > 0 ? 120 : 0
    ) : 0,
    dueDate: item.f1_fecha_vcto_max,
    status: getStatus(item.f1_fecha_vcto_max ? Math.max(
      item.f1_saldo_vencido1 > 0 ? 30 : 0,
      item.f1_saldo_vencido2 > 0 ? 60 : 0,
      item.f1_saldo_vencido3 > 0 ? 90 : 0,
      item.f1_saldo_vencido4 > 0 ? 120 : 0
    ) : 0),
  }))
}

export const adaptCarteraToKPIs = (items: CarteraItem[]) => {
  const totalCorriente = items.reduce((sum, i) => sum + i.f1_saldo_corriente_total, 0)
  const totalVencida = items.reduce((sum, i) => sum + i.f1_saldo_vencido_total, 0)
  const totalCartera = totalCorriente + totalVencida
  const clientesEnMora = items.filter((i) => i.f1_saldo_vencido_total > 0).length
  const porcentajeVencida = totalCartera > 0 ? (totalVencida / totalCartera) * 100 : 0

  const formatBillions = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`
    return `$${value.toLocaleString("es-CO")}`
  }

  return {
    totalCorriente: formatBillions(totalCorriente),
    totalVencida: formatBillions(totalVencida),
    clientesEnMora,
    totalClientes: items.length,
    porcentajeVencida: porcentajeVencida.toFixed(1),
  }
}