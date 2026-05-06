import type { CarteraItem } from "@/hooks/use-cartera"
import type { Client } from "@/components/cartera/clients-table"

const getStatus = (diasVencido: number): Client["status"] => {
  if (diasVencido === 0) return "corriente"
  if (diasVencido <= 60) return "gestion"
  return "vencida"
}

const getMaxDaysOverdue = (item: CarteraItem): number => {
  // Calcula los días vencidos desde la fecha mínima de vencimiento
  if (item.f1_saldo_vencido_total === 0) return 0
  const fechaVcto = new Date(item.f1_fecha_vcto_min)
  const hoy = new Date()
  const dias = Math.floor((hoy.getTime() - fechaVcto.getTime()) / (1000 * 60 * 60 * 24))
  return dias > 0 ? dias : 0
}

export const adaptCarteraToClients = (items: CarteraItem[]): Client[] => {
  return items.map((item) => ({
    nit: item.f1_tercero,
    name: item.f1_tercero_razon_social,
    paymentCondition: item.f1_id_cond_pago,
    advisor: item.f1_asesor,
    channel: item.f_02_02,
    quota: item.f1_cupo,
    current: item.f1_saldo_corriente_total,
    overdue1: item.f1_saldo_vencido1,
    overdue2: item.f1_saldo_vencido2,
    overdue3: item.f1_saldo_vencido3,
    overdue4: item.f1_saldo_vencido4,
    overdue: item.f1_saldo_vencido_total,
    overcapacity: item.f1_saldo_corriente_total + item.f1_saldo_vencido_total - item.f1_cupo,
    totalBalance: item.f1_saldo_total,
    totalCop: item.f1_total_cop,
    remittanceValue: item.f_rem_valor_neto_total,
    remittanceWeight: item.f_rem_peso_total,
    remittanceDocuments: item.f_rem_cantidad_documentos,
    maxDaysOverdue: item.f1_fecha_vcto_max ? Math.max(
      item.f1_saldo_vencido1 > 0 ? 30 : 0,
      item.f1_saldo_vencido2 > 0 ? 60 : 0,
      item.f1_saldo_vencido3 > 0 ? 90 : 0,
      item.f1_saldo_vencido4 > 0 ? 120 : 0
    ) : 0,
    dueDate: item.f1_fecha_vcto_max,
    status: getStatus(getMaxDaysOverdue(item)),
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