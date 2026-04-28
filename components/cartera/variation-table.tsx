"use client"

import { useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  AlertCircle,
  DollarSign,
  ArrowUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface VariationClient {
  id: string
  nit: string
  razonSocial: string
  cupo: number
  carteraMesActual: number
  carteraUltimoMes: number
  variacionCop: number
  variacionPct: number
  sobrecupoCop: number
  sobrecupoPct: number
}

// Mock data for the variation table
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercent = (value: number) => {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

const columns: ColumnDef<VariationClient>[] = [
  {
    accessorKey: "nit",
    header: "NIT",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.getValue("nit")}</span>
    ),
  },
  {
    accessorKey: "razonSocial",
    header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Razón Social
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("razonSocial")}</span>
    ),
  },
  {
    accessorKey: "cupo",
    header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Cupo (COP)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
    cell: ({ row }) => (
      <span className="text-right font-mono">
        {formatCurrency(row.getValue("cupo"))}
      </span>
    ),
  },
  {
    accessorKey: "carteraMesActual",
    header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Cartera Mes Actual (COP)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
    cell: ({ row }) => (
      <span className="text-right font-mono">
        {formatCurrency(row.getValue("carteraMesActual"))}
      </span>
    ),
  },
  {
    accessorKey: "carteraUltimoMes",
    header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Cartera Último Mes (COP)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
    cell: ({ row }) => (
      <span className="text-right font-mono text-muted-foreground">
        {formatCurrency(row.getValue("carteraUltimoMes"))}
      </span>
    ),
  },
  {
    accessorKey: "variacionCop",
    header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Variación COP
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
    cell: ({ row }) => {
      const value = row.getValue("variacionCop") as number
      const isPositive = value >= 0
      return (
        <span
          className={cn(
            "flex items-center gap-1 font-mono",
            isPositive ? "text-green-600" : "text-red-600"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          {formatCurrency(Math.abs(value))}
        </span>
      )
    },
  },
  {
    accessorKey: "variacionPct",
    header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Variación %
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
    cell: ({ row }) => {
      const value = row.getValue("variacionPct") as number
      const isPositive = value >= 0
      return (
        <span
          className={cn(
            "flex items-center gap-1 font-semibold",
            isPositive ? "text-green-600" : "text-red-600"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          {formatPercent(value)}
        </span>
      )
    },
  },
  {
    accessorKey: "sobrecupoCop",
    header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Sobrecupo (COP)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
    cell: ({ row }) => {
      const value = row.getValue("sobrecupoCop") as number
      return (
        <span
          className={cn(
            "font-mono",
            value > 0 ? "text-red-600 font-semibold" : "text-muted-foreground"
          )}
        >
          {formatCurrency(value)}
        </span>
      )
    },
  },
  {
    accessorKey: "sobrecupoPct",
    header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Sobrecupo %
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
    cell: ({ row }) => {
      const value = row.getValue("sobrecupoPct") as number
      return (
        <span
          className={cn(
            "flex items-center gap-1 font-semibold",
            value > 0 ? "text-red-600" : "text-muted-foreground"
          )}
        >
          {value > 50 && <AlertTriangle className="h-4 w-4" />}
          {value.toFixed(2)}%
        </span>
      )
    },
  },
]

export function VariationTable() {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: mockVariationData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

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

  const currentMonth = new Date().toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes en Sobrecupo
            </CardTitle>
            <Users className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {clientesEnSobrecupo}
            </div>
            <p className="text-xs text-muted-foreground">
              de {mockVariationData.length} clientes totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mayor Sobrecupo</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(mayorSobrecupo)}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {mayorSobrecupoCliente?.razonSocial}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cartera Total del Mes
            </CardTitle>
            <DollarSign className="h-4 w-4 text-[#ff6600]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(carteraTotalMesActual)}
            </div>
            <p
              className={cn(
                "flex items-center gap-1 text-xs",
                variacionTotal >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {variacionTotal >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {formatPercent(variacionTotalPct)} vs mes anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Variación de Cartera — Mes Actual vs Anterior</CardTitle>
            <Badge
              variant="outline"
              className="border-[#ff6600] text-[#ff6600] capitalize"
            >
              {currentMonth}
            </Badge>
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
                  table.getRowModel().rows.map((row) => {
                    const hasSobrecupo = row.original.sobrecupoCop > 0
                    return (
                      <TableRow
                        key={row.id}
                        className={cn(hasSobrecupo && "bg-red-50 dark:bg-red-950/20")}
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
                  })
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

          {/* Pagination */}
          <div className="flex items-center justify-between py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando{" "}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
              –
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                mockVariationData.length
              )}{" "}
              de {mockVariationData.length} clientes
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
