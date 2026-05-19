"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMemo } from "react"
import type { VariationClient } from "./variation-table"

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  trend?: { value: string; positive: boolean }
  accentColor: string
  badge?: string
}

// ── Props del componente público ─────────────────────────────────────────────
interface KPIVariationCardsProps {
  data: VariationClient[]
}

function KPICard({ title, value, subtitle, trend, accentColor, badge }: KPICardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xm font-medium text-muted-foreground">{title}</p>
            <p className="text-xl font-bold" style={{ color: accentColor }}>{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          {badge && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              {badge}
            </span>
          )}
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1">
            {trend.positive
              ? <TrendingUp className="h-4 w-4 text-green-500" />
              : <TrendingDown className="h-4 w-4 text-red-500" />}
            <span className={cn("text-xs font-medium", trend.positive ? "text-green-500" : "text-red-500")}>
              {trend.value}
            </span>
            <span className="text-xs text-muted-foreground">vs mes anterior</span>
          </div>
        )}
      </CardContent>
      <div className="absolute bottom-0 left-0 h-1 w-full" style={{ backgroundColor: accentColor }} />
    </Card>
  )
}

export function KPICards({ data }: KPIVariationCardsProps) {
  const kpis = useMemo(() => {
    const clientesEnSobrecupo = data.filter((c) => c.sobrecupoCop > 0).length

    // Excluir SIDOC (NIT 890333023) del cálculo del mayor sobrecupo
    const EXCLUIDOS_MAYOR_SOBRECUPO = ["890333023"]
    const dataMayorSobrecupo = data.filter(
      (c) => !EXCLUIDOS_MAYOR_SOBRECUPO.includes(c.nit.trim())
    )
    const mayorSobrecupo = Math.max(0, ...dataMayorSobrecupo.map((c) => c.sobrecupoCop))
    const mayorSobrecupoCliente = dataMayorSobrecupo.find((c) => c.sobrecupoCop === mayorSobrecupo)
    const carteraTotalMesActual = data.reduce((acc, c) => acc + c.carteraMesActual, 0)
    const carteraTotalMesAnterior = data.reduce((acc, c) => acc + c.carteraUltimoMes, 0)
    const variacionTotalPct = carteraTotalMesAnterior !== 0
      ? ((carteraTotalMesActual - carteraTotalMesAnterior) / carteraTotalMesAnterior) * 100
      : 0

    return { clientesEnSobrecupo, mayorSobrecupo, mayorSobrecupoCliente, carteraTotalMesActual, variacionTotalPct }
  }, [data])

  const cards: KPICardProps[] = [
    {
      title: "Clientes en Sobrecupo",
      value: kpis.clientesEnSobrecupo.toString(),
      subtitle: `de ${data.length} clientes`,
      accentColor: "#E7000B",
    },
    {
      title: "Mayor Sobrecupo",
      value: `$${kpis.mayorSobrecupo.toLocaleString("es-CO")}`,
      subtitle: kpis.mayorSobrecupoCliente?.razonSocial ?? "—",
      accentColor: "#E7000B",
    },
    {
      title: "Cartera Total del Mes Actual",
      value: `$${kpis.carteraTotalMesActual.toLocaleString("es-CO")}`,
      trend: {
        value: `${kpis.variacionTotalPct >= 0 ? "+" : ""}${kpis.variacionTotalPct.toFixed(2)}%`,
        positive: kpis.variacionTotalPct >= 0,
      },
      accentColor: "#050b12",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  )
}