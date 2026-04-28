"use client"

import { useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  flexRender,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  LabelList,
} from "recharts"
import { Download, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface RotationData {
  periodo: string
  cartera: number
  ventaBruta: number
  rebate: number
  ventaNeta: number
  promedioVentas3m: number
  acumuladoVenta12m: number
  rotCxC: number
}

// Generate mock data for the last 12 months
const generateMockRotationData = (): RotationData[] => {
  const data: RotationData[] = []
  const now = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const periodo = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`
    
    // Generate realistic values
    const ventaBruta = Math.floor(Math.random() * 500000000) + 800000000
    const rebate = Math.floor(ventaBruta * (Math.random() * 0.08 + 0.02))
    const ventaNeta = ventaBruta - rebate
    const cartera = Math.floor(Math.random() * 300000000) + 400000000
    
    data.push({
      periodo,
      cartera,
      ventaBruta,
      rebate,
      ventaNeta,
      promedioVentas3m: 0, // Will be calculated
      acumuladoVenta12m: 0, // Will be calculated
      rotCxC: 0, // Will be calculated
    })
  }
  
  // Calculate derived fields
  for (let i = 0; i < data.length; i++) {
    // Promedio últimos 3 meses
    if (i >= 2) {
      data[i].promedioVentas3m = Math.floor(
        (data[i].ventaNeta + data[i - 1].ventaNeta + data[i - 2].ventaNeta) / 3
      )
    } else if (i === 1) {
      data[i].promedioVentas3m = Math.floor(
        (data[i].ventaNeta + data[i - 1].ventaNeta) / 2
      )
    } else {
      data[i].promedioVentas3m = data[i].ventaNeta
    }
    
    // Acumulado últimos 12 meses
    const startIdx = Math.max(0, i - 11)
    data[i].acumuladoVenta12m = data
      .slice(startIdx, i + 1)
      .reduce((acc, d) => acc + d.ventaNeta, 0)
    
    // Rotación CxC (días)
    data[i].rotCxC = Math.round(
      (data[i].cartera / data[i].acumuladoVenta12m) * 360
    )
  }
  
  return data
}

const mockRotationData = generateMockRotationData()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: "compact",
    compactDisplay: "short",
  }).format(value)
}

const formatCurrencyFull = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const getRotationColor = (days: number): string => {
  if (days <= 30) return "#22C55E" // green
  if (days <= 45) return "#F59E0B" // yellow
  return "#EF4444" // red
}

const getRotationBgClass = (days: number): string => {
  if (days <= 30) return "bg-green-100 dark:bg-green-950/50"
  if (days <= 45) return "bg-yellow-100 dark:bg-yellow-950/50"
  return "bg-red-100 dark:bg-red-950/50"
}

const columnTooltips: Record<string, string> = {
  periodo: "Mes en formato YYYYMM",
  cartera: "Saldo en $$ de cuenta 13050505 (Clientes nacionales) y cuenta 28050505 (Anticipos recibidos)",
  ventaBruta: "Saldo en $$ de cuenta 41 (mayor de ingresos)",
  rebate: "Saldo en $$ de cuenta 53053501 (descuentos comerciales)",
  ventaNeta: "Venta Bruta − Rebate",
  promedioVentas3m: "Promedio aritmético de Venta Neta de los últimos 3 períodos",
  acumuladoVenta12m: "Suma acumulada de Venta Neta de los últimos 12 períodos",
  rotCxC: "(Cartera / Acumulado Venta N últimos 12 meses) × 360",
}

const HeaderWithTooltip = ({ label, tooltipKey }: { label: string; tooltipKey: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex cursor-help items-center gap-1">
          {label}
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-xs">{columnTooltips[tooltipKey]}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

const columns: ColumnDef<RotationData>[] = [
  {
    accessorKey: "periodo",
    header: () => <HeaderWithTooltip label="Período" tooltipKey="periodo" />,
    cell: ({ row }) => {
      const periodo = row.getValue("periodo") as string
      const isCurrentMonth = periodo === mockRotationData[mockRotationData.length - 1].periodo
      return (
        <span className={cn("font-mono text-sm", isCurrentMonth && "font-bold")}>
          {periodo}
        </span>
      )
    },
  },
  {
    accessorKey: "cartera",
    header: () => <HeaderWithTooltip label="Cartera" tooltipKey="cartera" />,
    cell: ({ row }) => {
      const periodo = row.original.periodo
      const isCurrentMonth = periodo === mockRotationData[mockRotationData.length - 1].periodo
      return (
        <span className={cn("font-mono text-sm", isCurrentMonth && "font-bold")}>
          {formatCurrency(row.getValue("cartera"))}
        </span>
      )
    },
  },
  {
    accessorKey: "ventaBruta",
    header: () => <HeaderWithTooltip label="Venta Bruta" tooltipKey="ventaBruta" />,
    cell: ({ row }) => {
      const periodo = row.original.periodo
      const isCurrentMonth = periodo === mockRotationData[mockRotationData.length - 1].periodo
      return (
        <span className={cn("font-mono text-sm", isCurrentMonth && "font-bold")}>
          {formatCurrency(row.getValue("ventaBruta"))}
        </span>
      )
    },
  },
  {
    accessorKey: "rebate",
    header: () => <HeaderWithTooltip label="Rebate" tooltipKey="rebate" />,
    cell: ({ row }) => {
      const periodo = row.original.periodo
      const isCurrentMonth = periodo === mockRotationData[mockRotationData.length - 1].periodo
      return (
        <span className={cn("font-mono text-sm text-[#ff6600]", isCurrentMonth && "font-bold")}>
          {formatCurrency(row.getValue("rebate"))}
        </span>
      )
    },
  },
  {
    accessorKey: "ventaNeta",
    header: () => <HeaderWithTooltip label="Venta Neta" tooltipKey="ventaNeta" />,
    cell: ({ row }) => {
      const periodo = row.original.periodo
      const isCurrentMonth = periodo === mockRotationData[mockRotationData.length - 1].periodo
      return (
        <span className={cn("font-mono text-sm text-[#00359a]", isCurrentMonth && "font-bold")}>
          {formatCurrency(row.getValue("ventaNeta"))}
        </span>
      )
    },
  },
  {
    accessorKey: "promedioVentas3m",
    header: () => <HeaderWithTooltip label="Prom. Ventas (3m)" tooltipKey="promedioVentas3m" />,
    cell: ({ row }) => {
      const periodo = row.original.periodo
      const isCurrentMonth = periodo === mockRotationData[mockRotationData.length - 1].periodo
      return (
        <span className={cn("font-mono text-sm text-muted-foreground", isCurrentMonth && "font-bold text-foreground")}>
          {formatCurrency(row.getValue("promedioVentas3m"))}
        </span>
      )
    },
  },
  {
    accessorKey: "acumuladoVenta12m",
    header: () => <HeaderWithTooltip label="Acum. Venta (12m)" tooltipKey="acumuladoVenta12m" />,
    cell: ({ row }) => {
      const periodo = row.original.periodo
      const isCurrentMonth = periodo === mockRotationData[mockRotationData.length - 1].periodo
      return (
        <span className={cn("font-mono text-sm text-muted-foreground", isCurrentMonth && "font-bold text-foreground")}>
          {formatCurrency(row.getValue("acumuladoVenta12m"))}
        </span>
      )
    },
  },
  {
    accessorKey: "rotCxC",
    header: () => <HeaderWithTooltip label="Rot CxC (días)" tooltipKey="rotCxC" />,
    cell: ({ row }) => {
      const days = row.getValue("rotCxC") as number
      const periodo = row.original.periodo
      const isCurrentMonth = periodo === mockRotationData[mockRotationData.length - 1].periodo
      return (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-md px-2 py-1 font-mono text-sm font-semibold",
            getRotationBgClass(days),
            isCurrentMonth && "ring-2 ring-offset-1"
          )}
          style={{ color: getRotationColor(days) }}
        >
          {days} días
        </span>
      )
    },
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const cartera = payload.find((p: { dataKey: string }) => p.dataKey === "cartera")?.value || 0
    const ventaNeta = payload.find((p: { dataKey: string }) => p.dataKey === "ventaNeta")?.value || 0
    const rotCxC = payload.find((p: { dataKey: string }) => p.dataKey === "rotCxC")?.value || 0

    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="mb-2 font-semibold">Período: {label}</p>
        <div className="space-y-1 text-sm">
          <p>
            <span className="inline-block w-3 h-3 rounded mr-2" style={{ backgroundColor: "#ff6600" }} />
            Cartera: {formatCurrencyFull(cartera)}
          </p>
          <p>
            <span className="inline-block w-3 h-3 rounded mr-2" style={{ backgroundColor: "#00359a" }} />
            Venta Neta: {formatCurrencyFull(ventaNeta)}
          </p>
          <p>
            <span className="inline-block w-3 h-3 rounded-full border-2 mr-2" style={{ borderColor: getRotationColor(rotCxC) }} />
            Rot CxC:{" "}
            <span style={{ color: getRotationColor(rotCxC), fontWeight: "bold" }}>
              {rotCxC} días
            </span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

export function RotationTable() {
  const [rangeFilter, setRangeFilter] = useState("12")

  const table = useReactTable({
    data: mockRotationData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Calculate totals/averages
  const totals = {
    cartera: mockRotationData.reduce((acc, d) => acc + d.cartera, 0) / mockRotationData.length,
    ventaBruta: mockRotationData.reduce((acc, d) => acc + d.ventaBruta, 0),
    rebate: mockRotationData.reduce((acc, d) => acc + d.rebate, 0),
    ventaNeta: mockRotationData.reduce((acc, d) => acc + d.ventaNeta, 0),
    rotCxC: Math.round(mockRotationData.reduce((acc, d) => acc + d.rotCxC, 0) / mockRotationData.length),
  }

  return (
    <div className="space-y-6">
      {/* Combined Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Evolución Cartera - Venta Neta - Rotación CxC — últimos 12 períodos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={mockRotationData}
                margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="periodo"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  domain={[0, "auto"]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 60]}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  tickFormatter={(value) => `${value}d`}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 20 }}
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      cartera: "Cartera",
                      ventaNeta: "Venta Neta",
                      rotCxC: "Rot CxC (días)",
                    }
                    return labels[value] || value
                  }}
                />
                
                {/* Reference area for optimal rotation zone */}
                <ReferenceArea
                  yAxisId="right"
                  y1={0}
                  y2={30}
                  fill="#22C55E"
                  fillOpacity={0.1}
                  label={{
                    value: "Zona óptima",
                    position: "insideRight",
                    fontSize: 10,
                    fill: "#22C55E",
                  }}
                />
                
                <Bar
                  yAxisId="left"
                  dataKey="cartera"
                  fill="#ff6600"
                  fillOpacity={0.8}
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Bar
                  yAxisId="left"
                  dataKey="ventaNeta"
                  fill="#00359a"
                  fillOpacity={0.8}
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rotCxC"
                  stroke="#6B7280"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#fff", stroke: "#6B7280", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                >
                  <LabelList
                    dataKey="rotCxC"
                    position="top"
                    formatter={(value: number) => `${value}d`}
                    style={{ fontSize: 10, fill: "#6B7280" }}
                  />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Rotación de Cartera</CardTitle>
            <Select value={rangeFilter} onValueChange={setRangeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar rango" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
                <SelectItem value="24">Últimos 24 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  <>
                    {table.getRowModel().rows.map((row) => {
                      const isCurrentMonth =
                        row.original.periodo ===
                        mockRotationData[mockRotationData.length - 1].periodo
                      return (
                        <TableRow
                          key={row.id}
                          className={cn(
                            isCurrentMonth && "bg-muted/50 font-semibold"
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      )
                    })}
                    {/* Totals/Averages Row */}
                    <TableRow className="bg-muted font-semibold">
                      <TableCell>TOTALES / PROM.</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(totals.cartera)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(totals.ventaBruta)}
                      </TableCell>
                      <TableCell className="font-mono text-[#ff6600]">
                        {formatCurrency(totals.rebate)}
                      </TableCell>
                      <TableCell className="font-mono text-[#00359a]">
                        {formatCurrency(totals.ventaNeta)}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        —
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        —
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center justify-center rounded-md px-2 py-1 font-mono text-sm font-semibold",
                            getRotationBgClass(totals.rotCxC)
                          )}
                          style={{ color: getRotationColor(totals.rotCxC) }}
                        >
                          {totals.rotCxC} días
                        </span>
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No hay datos disponibles.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
