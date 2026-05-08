"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, AlertCircle, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { VariationClient } from "./variation-table"

interface KPICardProps {
    title: string
    value: string
    subtitle?: string
    trend?: {
        value: string
        positive: boolean
    }
    accentColor: string
    badge?: string
}

const mockVariationData: VariationClient[] = [
  {
    id: "1",
    nit: "900123456-1",
    razonSocial: "Comercializadora ABC S.A.S.",
    cupo: 500000000,
    carteraMesActual: 620000000,
    carteraUltimoMes: 480000000,
    variacionCop: 140000000,
    variacionPct: 29.17,
    sobrecupoCop: 120000000,
    sobrecupoPct: 24,
  },
  {
    id: "2",
    nit: "800987654-2",
    razonSocial: "Distribuidora del Norte Ltda.",
    cupo: 300000000,
    carteraMesActual: 280000000,
    carteraUltimoMes: 320000000,
    variacionCop: -40000000,
    variacionPct: -12.5,
    sobrecupoCop: 0,
    sobrecupoPct: 0,
  },
  {
    id: "3",
    nit: "901234567-3",
    razonSocial: "Inversiones XYZ S.A.",
    cupo: 800000000,
    carteraMesActual: 1050000000,
    carteraUltimoMes: 750000000,
    variacionCop: 300000000,
    variacionPct: 40,
    sobrecupoCop: 250000000,
    sobrecupoPct: 31.25,
  },
  {
    id: "4",
    nit: "890456789-4",
    razonSocial: "Grupo Empresarial del Caribe",
    cupo: 450000000,
    carteraMesActual: 720000000,
    carteraUltimoMes: 400000000,
    variacionCop: 320000000,
    variacionPct: 80,
    sobrecupoCop: 270000000,
    sobrecupoPct: 60,
  },
  {
    id: "5",
    nit: "800111222-5",
    razonSocial: "Almacenes Unidos S.A.",
    cupo: 250000000,
    carteraMesActual: 180000000,
    carteraUltimoMes: 220000000,
    variacionCop: -40000000,
    variacionPct: -18.18,
    sobrecupoCop: 0,
    sobrecupoPct: 0,
  },
  {
    id: "6",
    nit: "901555666-6",
    razonSocial: "Suministros Industriales Ltda.",
    cupo: 600000000,
    carteraMesActual: 550000000,
    carteraUltimoMes: 480000000,
    variacionCop: 70000000,
    variacionPct: 14.58,
    sobrecupoCop: 0,
    sobrecupoPct: 0,
  },
  {
    id: "7",
    nit: "800777888-7",
    razonSocial: "Ferretería Central S.A.S.",
    cupo: 200000000,
    carteraMesActual: 350000000,
    carteraUltimoMes: 190000000,
    variacionCop: 160000000,
    variacionPct: 84.21,
    sobrecupoCop: 150000000,
    sobrecupoPct: 75,
  },
  {
    id: "8",
    nit: "890999000-8",
    razonSocial: "Textiles del Pacífico S.A.",
    cupo: 400000000,
    carteraMesActual: 380000000,
    carteraUltimoMes: 410000000,
    variacionCop: -30000000,
    variacionPct: -7.32,
    sobrecupoCop: 0,
    sobrecupoPct: 0,
  },
  {
    id: "9",
    nit: "901888999-9",
    razonSocial: "Importadora Global Ltda.",
    cupo: 700000000,
    carteraMesActual: 680000000,
    carteraUltimoMes: 550000000,
    variacionCop: 130000000,
    variacionPct: 23.64,
    sobrecupoCop: 0,
    sobrecupoPct: 0,
  },
  {
    id: "10",
    nit: "800333444-0",
    razonSocial: "Químicos del Valle S.A.",
    cupo: 350000000,
    carteraMesActual: 420000000,
    carteraUltimoMes: 380000000,
    variacionCop: 40000000,
    variacionPct: 10.53,
    sobrecupoCop: 70000000,
    sobrecupoPct: 20,
  },
]

// Calculate KPIs
  const clientesEnSobrecupo = mockVariationData.filter(
    (c) => c.sobrecupoCop > 0
  ).length
  const mayorSobrecupo = Math.max(...mockVariationData.map((c) => c.sobrecupoCop))
  const mayorSobrecupoCliente = mockVariationData.find(
    (c) => c.sobrecupoCop === mayorSobrecupo
  )
  const carteraTotalMesActual = mockVariationData.reduce(
    (acc, c) => acc + c.carteraMesActual,
    0
  )
  const carteraTotalMesAnterior = mockVariationData.reduce(
    (acc, c) => acc + c.carteraUltimoMes,
    0
  )
  const variacionTotal = carteraTotalMesActual - carteraTotalMesAnterior
  const variacionTotalPct = (variacionTotal / carteraTotalMesAnterior) * 100

function KPICard({
    title,
    value,
    subtitle,
    trend,
    accentColor,
    badge,
}: KPICardProps) {
    return (
        <Card className="relative overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-xm font-medium text-muted-foreground">{title}</p>
                        <p
                            className="text-xl font-bold"
                            style={{ color: accentColor }}
                        >
                            {value}
                        </p>
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
                        {trend.positive ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span
                            className={cn(
                                "text-xs font-medium",
                                trend.positive ? "text-green-500" : "text-red-500"
                            )}
                        >
                            {trend.value}
                        </span>
                        <span className="text-xs text-muted-foreground">vs mes anterior</span>
                    </div>
                )}
            </CardContent>
            {/* Bottom accent line */}
            <div
                className="absolute bottom-0 left-0 h-1 w-full"
                style={{ backgroundColor: accentColor }}
            />
        </Card>
    )
    
}

export function KPICards() {
  const kpis: KPICardProps[] = [
    {
      title: "Clientes en Sobrecupo",
      value: clientesEnSobrecupo.toString(),
      subtitle: `de ${mockVariationData.length} clientes`,
      accentColor: "#E7000B",
    },
    {
      title: "Mayor Sobrecupo",
      value: `$${mayorSobrecupo.toLocaleString("es-CO")}`,
      subtitle: `${mayorSobrecupoCliente?.razonSocial}`,
      accentColor: "#E7000B",
    },
    {
      title: "Cartera Total del Mes Actual",
      value: `$${carteraTotalMesActual.toLocaleString("es-CO")}`,
      trend: {
        value: `${variacionTotalPct >= 0 ? "+" : ""}${variacionTotalPct.toFixed(2)}%`,
        positive: variacionTotalPct >= 0,
      },
      accentColor: "#050b12",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  )
}