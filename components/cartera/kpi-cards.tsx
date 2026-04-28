"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, Percent } from "lucide-react"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string
  subtitle: string
  trend?: {
    value: string
    positive: boolean
  }
  accentColor: string
  badge?: string
  progressArc?: {
    percentage: number
    threshold: number
  }
}

function KPICard({
  title,
  value,
  subtitle,
  trend,
  accentColor,
  badge,
  progressArc,
}: KPICardProps) {
  const arcColor =
    progressArc && progressArc.percentage > progressArc.threshold
      ? "#EF4444"
      : "#22C55E"

  return (
    <Card className="relative overflow-hidden">
      {/* Progress Arc Background */}
      {progressArc && (
        <div className="absolute -right-8 -top-8 h-32 w-32 opacity-20">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={arcColor}
              strokeWidth="8"
              strokeDasharray={`${progressArc.percentage * 2.51} 251`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p
              className="text-2xl font-bold"
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
      title: "Total Cartera Corriente",
      value: "$4.28B",
      subtitle: "1,234 facturas al día",
      trend: { value: "+12.5%", positive: true },
      accentColor: "#ff6600",
    },
    {
      title: "Total Cartera Vencida",
      value: "$1.24B",
      subtitle: "342 facturas vencidas",
      trend: { value: "+8.3%", positive: false },
      accentColor: "#EF4444",
    },
    {
      title: "Clientes en Mora",
      value: "87",
      subtitle: "de 456 clientes activos",
      badge: "+5 nuevos",
      accentColor: "#00359a",
    },
    {
      title: "% Vencida sobre Total",
      value: "22.5%",
      subtitle: "Meta: < 25%",
      accentColor: "#22C55E",
      progressArc: { percentage: 22.5, threshold: 25 },
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  )
}
