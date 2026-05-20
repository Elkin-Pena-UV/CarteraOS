"use client"

import { useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table"
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  LabelList,
} from "recharts"
import {
  Info,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { RotacionItem } from "@/hooks/use-rotacion"

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type { RotacionItem as RotationData }

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} M`
  }
  return `$${value.toLocaleString("es-CO")}`
}

const formatCurrencyFull = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

const getRotationColor = (days: number): string => {
  if (days <= 30) return "#22C55E"
  if (days <= 45) return "#F59E0B"
  return "#EF4444"
}

const getRotationBgClass = (days: number): string => {
  if (days <= 30) return "bg-green-100 dark:bg-green-950/50"
  if (days <= 45) return "bg-yellow-100 dark:bg-yellow-950/50"
  return "bg-red-100 dark:bg-red-950/50"
}

// ── Tooltips por columna ──────────────────────────────────────────────────────
const columnTooltips: Record<string, string> = {
  periodo: "Mes en formato YYYYMM",
  cartera:
    "Saldo en $$ de cuenta 13050505 (Clientes nacionales) y cuenta 28050505 (Anticipos recibidos)",
  ventaBruta: "Saldo en $$ de cuenta 41 (mayor de ingresos)",
  rebate: "Saldo en $$ de cuenta 53053501 (descuentos comerciales)",
  ventaNeta: "(Venta Bruta − Rebate)",
  promedioVentas3m: "Promedio aritmético de Venta Neta de los últimos 3 períodos",
  acumuladoVenta12m: "Suma acumulada de Venta Neta de los últimos 12 períodos",
  rotCxC: "(Cartera / Acumulado Venta Neta últimos 12 meses) × 360",
}

// ── DraggableHeader ───────────────────────────────────────────────────────────
interface DraggableHeaderProps {
  id: string
  isPinned?: boolean
  label: string
  tooltip?: string
  size?: number
  isResizing?: boolean
  onResizeStart?: (e: React.MouseEvent | React.TouchEvent) => void
  column?: {
    toggleSorting: (desc: boolean) => void
    getIsSorted: () => false | "desc" | "asc"
    getCanSort: () => boolean
    clearSorting: () => void
  }
}

function DraggableHeader({
  id,
  isPinned = false,
  label,
  tooltip,
  size,
  isResizing,
  onResizeStart,
  column,
}: DraggableHeaderProps) {
  const { setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isPinned,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(size !== undefined ? { width: size } : {}),
    position: "relative",
  }

  const canSort = column?.getCanSort() ?? false

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "group select-none whitespace-nowrap",
        isDragging && "opacity-50 bg-muted z-10"
      )}
    >
      <div className="flex items-center gap-1.5 pr-3">
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
        <span className="text-xs font-semibold">{label}</span>
        {canSort && column && (
          <button
            onClick={() => {
              if (column.getIsSorted() === false) column.toggleSorting(false)
              else if (column.getIsSorted() === "asc") column.toggleSorting(true)
              else column.clearSorting()
            }}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
          >
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3.5 w-3.5" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Resize handle */}
      {onResizeStart && (
        <div
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e) }}
          onTouchStart={(e) => { e.stopPropagation(); onResizeStart(e) }}
          className={cn(
            "absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none z-10",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-[#ff6600]/60 rounded-sm",
            isResizing && "bg-[#ff6600] opacity-100"
          )}
          title="Arrastrar para redimensionar"
        />
      )}
    </TableHead>
  )
}

// ── Custom tooltip del gráfico ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const cartera =
      payload.find((p: { dataKey: string }) => p.dataKey === "cartera")?.value || 0
    const ventaNeta =
      payload.find((p: { dataKey: string }) => p.dataKey === "ventaNeta")?.value || 0
    const rotCxC =
      payload.find((p: { dataKey: string }) => p.dataKey === "rotCxC")?.value || 0

    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg">
        <p className="mb-2 font-semibold">Período: {label}</p>
        <div className="space-y-1 text-sm">
          <p>
            <span
              className="inline-block w-3 h-3 rounded mr-2"
              style={{ backgroundColor: "#ff6600" }}
            />
            Cartera: {formatCurrencyFull(cartera)}
          </p>
          <p>
            <span
              className="inline-block w-3 h-3 rounded mr-2"
              style={{ backgroundColor: "#00359a" }}
            />
            Venta Neta: {formatCurrencyFull(ventaNeta)}
          </p>
          <p>
            <span
              className="inline-block w-3 h-3 rounded-full border-2 mr-2"
              style={{ borderColor: getRotationColor(rotCxC) }}
            />
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

// ── Props ─────────────────────────────────────────────────────────────────────
interface RotationTableProps {
  data: RotacionItem[]
  fechaRef: string | null
  isFetching?: boolean
}

// ── Componente principal ──────────────────────────────────────────────────────
export function RotationTable({ data, fechaRef, isFetching = false }: RotationTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "periodo", desc: false },
  ])

  // Periodo más reciente de la serie (para destacar la fila)
  const lastPeriodo = data.length > 0 ? data[data.length - 1].periodo : null

  // ── Columnas ────────────────────────────────────────────────────────────────
  const columns: ColumnDef<RotacionItem>[] = [
    {
      id: "periodo",
      accessorKey: "periodo",
      header: "Período",
      cell: ({ row }) => (
        <span className={cn("font-mono text-sm", row.original.periodo === lastPeriodo && "font-bold")}>
          {row.getValue("periodo")}
        </span>
      ),
    },
    {
      id: "cartera",
      accessorKey: "cartera",
      header: "Cartera",
      cell: ({ row }) => (
        <span className={cn("font-mono text-sm", row.original.periodo === lastPeriodo && "font-bold")}>
          {formatCurrency(row.getValue("cartera"))}
        </span>
      ),
    },
    {
      id: "ventaBruta",
      accessorKey: "ventaBruta",
      header: "Venta Bruta",
      cell: ({ row }) => (
        <span className={cn("font-mono text-sm", row.original.periodo === lastPeriodo && "font-bold")}>
          {formatCurrency(row.getValue("ventaBruta"))}
        </span>
      ),
    },
    {
      id: "rebate",
      accessorKey: "rebate",
      header: "Rebate",
      cell: ({ row }) => (
        <span className={cn("font-mono text-sm text-[#ff6600]", row.original.periodo === lastPeriodo && "font-bold")}>
          {formatCurrency(row.getValue("rebate"))}
        </span>
      ),
    },
    {
      id: "ventaNeta",
      accessorKey: "ventaNeta",
      header: "Venta Neta",
      cell: ({ row }) => (
        <span className={cn("font-mono text-sm text-[#00359a]", row.original.periodo === lastPeriodo && "font-bold")}>
          {formatCurrency(row.getValue("ventaNeta"))}
        </span>
      ),
    },
    {
      id: "promedioVentas3m",
      accessorKey: "promedioVentas3m",
      header: "Prom. Ventas (3m)",
      cell: ({ row }) => (
        <span className={cn(
          "font-mono text-sm text-muted-foreground",
          row.original.periodo === lastPeriodo && "font-bold text-foreground"
        )}>
          {formatCurrency(row.getValue("promedioVentas3m"))}
        </span>
      ),
    },
    {
      id: "acumuladoVenta12m",
      accessorKey: "acumuladoVenta12m",
      header: "Acum. Venta (12m)",
      cell: ({ row }) => (
        <span className={cn(
          "font-mono text-sm text-muted-foreground",
          row.original.periodo === lastPeriodo && "font-bold text-foreground"
        )}>
          {formatCurrency(row.getValue("acumuladoVenta12m"))}
        </span>
      ),
    },
    {
      id: "rotCxC",
      accessorKey: "rotCxC",
      header: "Rot CxC (días)",
      cell: ({ row }) => {
        const days = row.getValue("rotCxC") as number
        return (
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-md px-2 py-1 font-mono text-sm font-semibold",
              getRotationBgClass(days),
              row.original.periodo === lastPeriodo && "ring-2 ring-offset-1"
            )}
            style={{ color: getRotationColor(days) }}
          >
            {days} días
          </span>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  const totals = {
    cartera: data.length > 0
      ? data.reduce((acc, d) => acc + d.cartera, 0) / data.length
      : 0,
    ventaBruta:     data.reduce((acc, d) => acc + d.ventaBruta, 0),
    rebate:         data.reduce((acc, d) => acc + d.rebate, 0),
    ventaNeta:      data.reduce((acc, d) => acc + d.ventaNeta, 0),
    rotCxC: data.length > 0
      ? Math.round(data.reduce((acc, d) => acc + d.rotCxC, 0) / data.length)
      : 0,
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ── Gráfico ────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Evolución Cartera - Venta Neta - Rotación CxC — últimos 12 períodos
              {fechaRef && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  (ref: {fechaRef.substring(0, 4)}-{fechaRef.substring(4, 6)}-{fechaRef.substring(6, 8)})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(v) => formatCurrency(v)}
                    tick={{ fontSize: 10 }}
                    width={80}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v) => `${v}d`}
                    tick={{ fontSize: 10 }}
                    width={45}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
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

        {/* ── Tabla ──────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between border-b py-0.5 px-4">
            <CardTitle>Rotación de Cartera</CardTitle>
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const colId = header.column.id
                        return (
                          <DraggableHeader
                            key={header.id}
                            id={colId}
                            isPinned={false}
                            label={
                              typeof header.column.columnDef.header === "string"
                                ? header.column.columnDef.header
                                : colId
                            }
                            tooltip={columnTooltips[colId]}
                            isResizing={header.column.getIsResizing()}
                            onResizeStart={header.getResizeHandler()}
                            column={
                              header.column.getCanSort()
                                ? header.column
                                : undefined
                            }
                          />
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    <>
                      {table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className={cn(
                            row.original.periodo === lastPeriodo && "bg-muted/50 font-semibold"
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}

                      {/* ── Fila de totales ──────────────────────────── */}
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
                        <TableCell className="font-mono text-muted-foreground">—</TableCell>
                        <TableCell className="font-mono text-muted-foreground">—</TableCell>
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
                      <TableCell colSpan={columns.length} className="h-24 text-center">
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
    </TooltipProvider>
  )
}
