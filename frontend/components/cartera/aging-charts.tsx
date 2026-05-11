"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { AgingData } from "@/lib/adapters/carteraAdapter"

// ---------------------------------------------------------------------------
// Helpers de formato
// ---------------------------------------------------------------------------

/** Formatea un valor en COP → "123M", "1.2B", etc. para los ejes/tooltips */
const formatCOP = (value: number): string => {
  if (value === 0) return "$0"
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(0)}M`
  if (Math.abs(value) >= 1_000)
    return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const COLORS = {
  "1-30d":  "#ff6600",
  "31-60d": "#00359a",
  "61-90d": "#F59E0B",
  ">90d":   "#EF4444",
} as const

// ---------------------------------------------------------------------------
// Tooltips
// ---------------------------------------------------------------------------

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg">
        <p className="mb-2 font-semibold text-card-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-card-foreground">
              {formatCOP(entry.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const DonutTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: data.payload.color }}
          />
          <span className="font-medium text-card-foreground">{data.name}</span>
        </div>
        <p className="mt-1 text-lg font-bold text-card-foreground">
          {formatCOP(data.value)}
        </p>
        {data.payload.total > 0 && (
          <p className="text-xs text-muted-foreground">
            {((data.value / data.payload.total) * 100).toFixed(1)}% del total
          </p>
        )}
      </div>
    )
  }
  return null
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AgingChartsProps {
  data: AgingData
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function AgingCharts({ data }: AgingChartsProps) {
  const { byChannel, distribution, totalVencida } = data

  // Enriquecer distribution con el total para el tooltip
  const distributionWithTotal = distribution.map((d) => ({
    ...d,
    total: totalVencida,
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Aging por Canal — Stacked Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Aging por Canal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {byChannel.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Sin datos de cartera vencida
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={byChannel}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="channel"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  // Truncar labels muy largos
                  tickFormatter={(v: string) =>
                    v.length > 14 ? v.substring(0, 13) + "…" : v
                  }
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCOP}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 20 }}
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
                <Bar dataKey="1-30d"  stackId="a" fill={COLORS["1-30d"]}  radius={[0, 0, 0, 0]} />
                <Bar dataKey="31-60d" stackId="a" fill={COLORS["31-60d"]} />
                <Bar dataKey="61-90d" stackId="a" fill={COLORS["61-90d"]} />
                <Bar dataKey=">90d"   stackId="a" fill={COLORS[">90d"]}   radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Distribución Total Aging — Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Distribución Total Aging
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalVencida === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Sin cartera vencida
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionWithTotal}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {distributionWithTotal.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                  {/* Etiqueta central */}
                  <text
                    x="50%"
                    y="42%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-2xl font-bold"
                    style={{ fontSize: 18, fontWeight: 700 }}
                  >
                    {formatCOP(totalVencida)}
                  </text>
                  <text
                    x="50%"
                    y="51%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-sm"
                    style={{ fontSize: 12 }}
                  >
                    Vencida
                  </text>
                </PieChart>
              </ResponsiveContainer>

              {/* Leyenda manual */}
              <div className="mt-2 flex flex-wrap justify-center gap-4">
                {distribution.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
