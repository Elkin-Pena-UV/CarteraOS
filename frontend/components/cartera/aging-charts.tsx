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

const agingByChannelData = [
  {
    channel: "Industrial",
    "1-30d": 420,
    "31-60d": 180,
    "61-90d": 95,
    ">90d": 45,
  },
  {
    channel: "Comercializador",
    "1-30d": 380,
    "31-60d": 220,
    "61-90d": 120,
    ">90d": 80,
  },
  {
    channel: "VTD - Venta Directa",
    "1-30d": 290,
    "31-60d": 150,
    "61-90d": 85,
    ">90d": 35,
  },
]

const agingDistributionData = [
  { name: "1-30 días", value: 1420, color: "#ff6600" },
  { name: "31-60 días", value: 715, color: "#00359a" },
  { name: "61-90 días", value: 385, color: "#F59E0B" },
  { name: ">90 días", value: 205, color: "#EF4444" },
]

const COLORS = {
  "1-30d": "#ff6600",
  "31-60d": "#00359a",
  "61-90d": "#F59E0B",
  ">90d": "#EF4444",
}

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
              ${entry.value}M
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
          ${data.value}M
        </p>
        <p className="text-xs text-muted-foreground">
          {((data.value / 2725) * 100).toFixed(1)}% del total
        </p>
      </div>
    )
  }
  return null
}

export function AgingCharts() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Aging by Channel - Stacked Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Aging por Canal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={agingByChannelData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="channel"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
              <Bar dataKey="1-30d" stackId="a" fill={COLORS["1-30d"]} radius={[0, 0, 0, 0]} />
              <Bar dataKey="31-60d" stackId="a" fill={COLORS["31-60d"]} />
              <Bar dataKey="61-90d" stackId="a" fill={COLORS["61-90d"]} />
              <Bar dataKey=">90d" stackId="a" fill={COLORS[">90d"]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Aging Distribution - Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Distribución Total Aging
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={agingDistributionData}
                cx="50%"
                cy="45%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {agingDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
              {/* Center Label */}
              <text
                x="50%"
                y="42%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-2xl font-bold"
              >
                $1.24B
              </text>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-sm"
              >
                Vencida
              </text>
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            {agingDistributionData.map((entry, index) => (
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
        </CardContent>
      </Card>
    </div>
  )
}
