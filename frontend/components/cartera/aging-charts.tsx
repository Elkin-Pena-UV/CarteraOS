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
  LabelList,
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

const CustomYAxisTick = ({ x, y, payload }: any) => {
  const words = (payload.value as string).split(" ")
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (test.length > 14) {
      if (current) lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)

  const lineHeight = 14
  const totalHeight = lines.length * lineHeight
  const startY = y - totalHeight / 2 + lineHeight / 2

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={startY - y + i * lineHeight}
          textAnchor="end"
          fontSize={11}
          className="fill-muted-foreground"
          fill="currentColor"
        >
          {line}
        </text>
      ))}
    </g>
  )
}


const CopByChannelTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const { totalCop, participacion } = payload[0].payload
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg">
        <p className="mb-1 font-semibold text-card-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">
          Total COP: <span className="font-medium text-card-foreground">{formatCOP(totalCop)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Participación: <span className="font-medium text-card-foreground">{participacion.toFixed(2)}%</span>
        </p>
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
      {/* Total COP por Canal — Horizontal Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Total COP por Canal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.totalCopByChannel.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Sin datos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.totalCopByChannel}
                layout="vertical"
                margin={{ top: 10, right: 40, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCOP}
                />
                <YAxis
                  type="category"
                  dataKey="channel"
                  tick={<CustomYAxisTick />}
                  className="text-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  width={99}
                  tickFormatter={(v: string) => v.length > 14 ? v.substring(0, 13) + "…" : v}
                />
                <Tooltip content={<CopByChannelTooltip />} />
                <Bar dataKey="totalCop" fill="#ff6600" radius={[0, 4, 4, 0]}>
                  <LabelList
                    dataKey="participacion"
                    position="right"
                    formatter={(v: number) => `${v.toFixed(2)}%`}
                    style={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                </Bar>
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
