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

// ---------------------------------------------------------------------------
// Tipos exportados para AgingCharts
// ---------------------------------------------------------------------------

export type AgingByChannelRow = {
  channel: string
  "1-30d": number
  "31-60d": number
  "61-90d": number
  ">90d": number
}

export type AgingDistributionRow = {
  name: string
  value: number
  color: string
}

export type AgingData = {
  byChannel: AgingByChannelRow[]
  totalCopByChannel: TotalCopByChannelRow[]
  distribution: AgingDistributionRow[]
  totalVencida: number
}

export type TotalCopByChannelRow = {
  channel: string
  totalCop: number
  participacion: number 
}

// ---------------------------------------------------------------------------
// Derivar datos de aging desde Client[] (ya filtrados)
// Los valores están en la misma unidad que el backend (COP).
// ---------------------------------------------------------------------------

export const adaptClientsToAging = (clients: Client[]): AgingData => {
  // Acumular por canal
  const channelMap = new Map<string, AgingByChannelRow>()

  for (const c of clients) {
    const key = c.channel || "Sin canal"
    if (!channelMap.has(key)) {
      channelMap.set(key, { channel: key, "1-30d": 0, "31-60d": 0, "61-90d": 0, ">90d": 0 })
    }
    const row = channelMap.get(key)!
    row["1-30d"]  += c.overdue1
    row["31-60d"] += c.overdue2
    row["61-90d"] += c.overdue3
    row[">90d"]   += c.overdue4
  }

  const byChannel = Array.from(channelMap.values())
    // Ordenar de mayor a menor cartera vencida total para que el gráfico sea más legible
    .sort((a, b) => {
      const sumA = a["1-30d"] + a["31-60d"] + a["61-90d"] + a[">90d"]
      const sumB = b["1-30d"] + b["31-60d"] + b["61-90d"] + b[">90d"]
      return sumB - sumA
    })

  // Distribución total (suma de todos los clientes filtrados)
  const total130  = clients.reduce((s, c) => s + c.overdue1, 0)
  const total3160 = clients.reduce((s, c) => s + c.overdue2, 0)
  const total6190 = clients.reduce((s, c) => s + c.overdue3, 0)
  const totalMas90 = clients.reduce((s, c) => s + c.overdue4, 0)
  const totalVencida = total130 + total3160 + total6190 + totalMas90

  const distribution: AgingDistributionRow[] = [
    { name: "1-30 días",  value: total130,   color: "#ff6600" },
    { name: "31-60 días", value: total3160,  color: "#00359a" },
    { name: "61-90 días", value: total6190,  color: "#F59E0B" },
    { name: ">90 días",   value: totalMas90, color: "#EF4444" },
  ]

   // Total COP por canal
  const totalCopMap = new Map<string, number>()
  for (const c of clients) {
    const key = c.channel || "Sin canal"
    totalCopMap.set(key, (totalCopMap.get(key) ?? 0) + c.totalCop)
  }
  const grandTotalCop = Array.from(totalCopMap.values()).reduce((s, v) => s + v, 0)

  const totalCopByChannel: TotalCopByChannelRow[] = Array.from(totalCopMap.entries())
    .map(([channel, totalCop]) => ({
      channel,
      totalCop,
      participacion: grandTotalCop > 0 ? (totalCop / grandTotalCop) * 100 : 0,
    }))
    .sort((a, b) => b.totalCop - a.totalCop)

  return { byChannel, totalCopByChannel, distribution, totalVencida }
}