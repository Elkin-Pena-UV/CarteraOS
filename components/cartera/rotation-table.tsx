"use client"

import { useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
  type Column,
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
import { Download, Info, ArrowUpDown, Mail } from "lucide-react"
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

const mockRotationData: RotationData[] = [
  {
    periodo: "202505",
    cartera: 653610396,
    ventaBruta: 1215000000,
    rebate: 74000000,
    ventaNeta: 1140342704,
    promedioVentas3m: 1140000000,
    acumuladoVenta12m: 1140000000,
    rotCxC: 206,
  },
  {
    periodo: "202506",
    cartera: 699284396,
    ventaBruta: 855000000,
    rebate: 44000000,
    ventaNeta: 810096668,
    promedioVentas3m: 975000000,
    acumuladoVenta12m: 1950000000,
    rotCxC: 129,
  },
  {
    periodo: "202507",
    cartera: 617256392,
    ventaBruta: 901000000,
    rebate: 83000000,
    ventaNeta: 817271697,
    promedioVentas3m: 923000000,
    acumuladoVenta12m: 2768000000,
    rotCxC: 80,
  },
  {
    periodo: "202508",
    cartera: 407896236,
    ventaBruta: 1204000000,
    rebate: 79000000,
    ventaNeta: 1124562805,
    promedioVentas3m: 917000000,
    acumuladoVenta12m: 3892000000,
    rotCxC: 38,
  },
  {
    periodo: "202509",
    cartera: 534969660,
    ventaBruta: 911000000,
    rebate: 77000000,
    ventaNeta: 834291188,
    promedioVentas3m: 925000000,
    acumuladoVenta12m: 4727000000,
    rotCxC: 41,
  },
  {
    periodo: "202510",
    cartera: 491196081,
    ventaBruta: 966000000,
    rebate: 45000000,
    ventaNeta: 920281796,
    promedioVentas3m: 960000000,
    acumuladoVenta12m: 5647000000,
    rotCxC: 31,
  },
  {
    periodo: "202511",
    cartera: 471454815,
    ventaBruta: 945000000,
    rebate: 25000000,
    ventaNeta: 920524964,
    promedioVentas3m: 892000000,
    acumuladoVenta12m: 6567000000,
    rotCxC: 26,
  },
  {
    periodo: "202512",
    cartera: 666583570,
    ventaBruta: 937000000,
    rebate: 43000000,
    ventaNeta: 893899919,
    promedioVentas3m: 912000000,
    acumuladoVenta12m: 7461000000,
    rotCxC: 32,
  },
  {
    periodo: "202601",
    cartera: 499139798,
    ventaBruta: 1094000000,
    rebate: 47000000,
    ventaNeta: 1047608980,
    promedioVentas3m: 954000000,
    acumuladoVenta12m: 8509000000,
    rotCxC: 21,
  },
  {
    periodo: "202602",
    cartera: 478712963,
    ventaBruta: 1054000000,
    rebate: 88000000,
    ventaNeta: 965610506,
    promedioVentas3m: 969000000,
    acumuladoVenta12m: 9474000000,
    rotCxC: 18,
  },
  {
    periodo: "202603",
    cartera: 537328519,
    ventaBruta: 966000000,
    rebate: 59000000,
    ventaNeta: 907583775,
    promedioVentas3m: 974000000,
    acumuladoVenta12m: 10000000000,
    rotCxC: 19,
  },
  {
    periodo: "202604",
    cartera: 607853936,
    ventaBruta: 960000000,
    rebate: 26000000,
    ventaNeta: 934050547,
    promedioVentas3m: 936000000,
    acumuladoVenta12m: 11000000000,
    rotCxC: 19,
  },
]


const formatCurrency = (value: number): string => {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(1)} B`
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(0)} MM`
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(0)} M`
  }
  return `$${value.toLocaleString("es-CO")}`
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
  ventaNeta: "(Venta Bruta − Rebate)",
  promedioVentas3m: "Promedio aritmético de Venta Neta de los últimos 3 períodos",
  acumuladoVenta12m: "Suma acumulada de Venta Neta de los últimos 12 períodos",
  rotCxC: "(Cartera / Acumulado Venta N últimos 12 meses) × 360",
}

const HeaderWithTooltip = ({
  label,
  tooltipKey,
  column,
}: {
  label: string
  tooltipKey: string
  column?: Column<RotationData, unknown>
}) => (
  <div className="flex items-center gap-1">
    {column ? (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        {label}
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ) : (
      <span>{label}</span>
    )}

    {/* El tooltip queda solo en el ícono Info, independiente del botón */}
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{columnTooltips[tooltipKey]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
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
    header: ({ column }) => (
    <HeaderWithTooltip label="Cartera" tooltipKey="cartera" column={column} />
    ),
    cell: ({ row }) => {
      const periodo = row.original.periodo
      const isCurrentMonth = periodo === mockRotationData[mockRotationData.length - 1].periodo
      return (
        <span className={cn("font-mono text-sm", isCurrentMonth && "font-bold")}>
          {formatCurrency(row.getValue("cartera"))}
          {/* {row.getValue("cartera")} */}
        </span>
      )
    },
  },
  {
    accessorKey: "ventaBruta",
    header: ({ column }) => (
    <HeaderWithTooltip label="Venta Bruta" tooltipKey="ventaBruta" column={column} />
   ),
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
    header: ({ column }) => (
    <HeaderWithTooltip label="Rebate" tooltipKey="rebate" column={column} />
    ),
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
    header: ({ column }) => (
    <HeaderWithTooltip label="Venta Neta" tooltipKey="ventaNeta" column={column} />
    ),
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
    header: ({ column }) => (
    <HeaderWithTooltip label="Prom. Ventas (3m)" tooltipKey="promedioVentas3m" column={column} />
    ),
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
    accessorKey: "rotCxC",
    header: ({ column }) => (
    <HeaderWithTooltip label="Rot CxC (días)" tooltipKey="rotCxC" column={column} />
    ),
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
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: mockRotationData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),  // 👈 agregar
    onSortingChange: setSorting,             // 👈 agregar
    state: { sorting }, 
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
            <Mail className="h-4 w-4" />
            Enviar reporte
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
