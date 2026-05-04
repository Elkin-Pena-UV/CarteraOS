"use client"

import { useState, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight, Eye, Phone, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ClientFilters } from "./filters-bar"

export type Client = {
  nit: string
  name: string
  advisor: string
  channel: string
  quota: number
  current: number
  overdue: number
  overcapacity: number
  maxDaysOverdue: number
  dueDate: string
  status: "corriente" | "vencida" | "gestion"
  isNew?: boolean
}

const statusConfig = {
  corriente: {
    label: "Corriente",
    color: "bg-green-500",
    textColor: "text-green-700 dark:text-green-400",
  },
  vencida: {
    label: "Vencida",
    color: "bg-red-500",
    textColor: "text-red-700 dark:text-red-400",
  },
  gestion: {
    label: "En gestión",
    color: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-400",
  },
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

interface ClientsTableProps {
  onViewClient: (client: Client) => void
  filters: ClientFilters
}

export function ClientsTable({ onViewClient, filters }: ClientsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const data: Client[] = useMemo(
  () => [
    {
      nit: "890.123.456-7",
      name: "DROGAS LA REBAJA",
      advisor: "Carlos Méndez",
      channel: "VTD - Venta Directa",
      quota: 300000000,
      current: 245000000,
      overdue: 89000000,
      overcapacity: 34000000,
      maxDaysOverdue: 95,
      dueDate: "2026-02-11",
      status: "vencida",
    },
    {
      nit: "800.456.789-1",
      name: "ÉXITO S.A.",
      advisor: "María González",
      channel: "Industrial",
      quota: 600000000,
      current: 520000000,
      overdue: 0,
      overcapacity: 0,
      maxDaysOverdue: 0,
      dueDate: "2026-05-20",
      status: "corriente",
    },
    {
      nit: "900.789.012-3",
      name: "DISTRIBUIDORA ABC",
      advisor: "Pedro Ramírez",
      channel: "Comercializador",
      quota: 200000000,
      current: 180000000,
      overdue: 45000000,
      overcapacity: 25000000,
      maxDaysOverdue: 67,
      dueDate: "2026-03-14",
      status: "gestion",
    },
    {
      nit: "860.234.567-8",
      name: "CARULLA VIVERO",
      advisor: "María González",
      channel: "VTD - Venta Directa",
      quota: 350000000,
      current: 380000000,
      overdue: 125000000,
      overcapacity: 55000000,
      maxDaysOverdue: 120,
      dueDate: "2026-01-25",
      status: "vencida",
    },
    {
      nit: "830.567.890-2",
      name: "OLÍMPICA S.A.",
      advisor: "Carlos Méndez",
      channel: "VTD - Venta Directa",
      quota: 400000000,
      current: 290000000,
      overdue: 35000000,
      overcapacity: 0,
      maxDaysOverdue: 28,
      dueDate: "2026-04-01",
      status: "gestion",
      isNew: true,
    },
    {
      nit: "891.234.567-0",
      name: "LOCATEL COLOMBIA",
      advisor: "Laura Torres",
      channel: "Industrial",
      quota: 180000000,
      current: 156000000,
      overdue: 0,
      overcapacity: 0,
      maxDaysOverdue: 0,
      dueDate: "2026-05-30",
      status: "corriente",
    },
    {
      nit: "800.890.123-4",
      name: "RESTAURANT LA FRAGATA",
      advisor: "Pedro Ramírez",
      channel: "Industrial",
      quota: 50000000,
      current: 42000000,
      overdue: 18000000,
      overcapacity: 10000000,
      maxDaysOverdue: 45,
      dueDate: "2026-03-08",
      status: "vencida",
      isNew: true,
    },
    {
      nit: "900.345.678-9",
      name: "SUPERMERCADOS ARA",
      advisor: "María González",
      channel: "Industrial",
      quota: 500000000,
      current: 410000000,
      overdue: 78000000,
      overcapacity: 0,
      maxDaysOverdue: 55,
      dueDate: "2026-02-28",
      status: "gestion",
    },
    {
      nit: "860.678.901-5",
      name: "D1 COLOMBIA",
      advisor: "Carlos Méndez",
      channel: "Industrial",
      quota: 450000000,
      current: 380000000,
      overdue: 0,
      overcapacity: 0,
      maxDaysOverdue: 0,
      dueDate: "2026-06-12",
      status: "corriente",
    },
    {
      nit: "830.012.345-6",
      name: "JUMBO COLOMBIA",
      advisor: "Laura Torres",
      channel: "Comercializador",
      quota: 280000000,
      current: 295000000,
      overdue: 92000000,
      overcapacity: 47000000,
      maxDaysOverdue: 105,
      dueDate: "2026-01-12",
      status: "vencida",
    },
  ],
  []
);

  const filteredData = useMemo(() => {
    const normalizedClientName = filters.clientName.trim().toLowerCase()
    const normalizedAdvisor = filters.advisor.toLowerCase()
    const normalizedStatus = filters.status.toLowerCase()
    const normalizedChannel = filters.channel.toLowerCase()

    const minValue = filters.minValue === "" ? null : Number(filters.minValue)
    const maxValue = filters.maxValue === "" ? null : Number(filters.maxValue)

    const fromDate = filters.dateRange?.from
      ? new Date(filters.dateRange.from.setHours(0, 0, 0, 0))
      : null
    const toDate = filters.dateRange?.to
      ? new Date(filters.dateRange.to.setHours(23, 59, 59, 999))
      : null

    return data.filter((client) => {
      if (normalizedChannel && normalizedChannel !== "all") {
        if (!client.channel.toLowerCase().includes(normalizedChannel)) {
          return false
        }
      }

      if (normalizedAdvisor && normalizedAdvisor !== "all") {
        if (!client.advisor.toLowerCase().includes(normalizedAdvisor)) {
          return false
        }
      }

      if (normalizedStatus && normalizedStatus !== "all") {
        if (client.status.toLowerCase() !== normalizedStatus) {
          return false
        }
      }

      if (normalizedClientName && !client.name.toLowerCase().includes(normalizedClientName)) {
        return false
      }

      const portfolioValue = client.current + client.overdue
      if (minValue !== null && !Number.isNaN(minValue) && portfolioValue < minValue) {
        return false
      }
      if (maxValue !== null && !Number.isNaN(maxValue) && portfolioValue > maxValue) {
        return false
      }

      if (fromDate || toDate) {
        const clientDueDate = new Date(client.dueDate)
        if (fromDate && clientDueDate < fromDate) {
          return false
        }
        if (toDate && clientDueDate > toDate) {
          return false
        }
      }

      return true
    })
  }, [data, filters])
  const columns: ColumnDef<Client>[] = useMemo(
    () => [
      {
        accessorKey: "nit",
        header: "NIT",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.getValue("nit")}</span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Nombre Cliente
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("name")}</span>
        ),
      },
      {
        accessorKey: "channel",
        header: "Canal",
        cell: ({ row }) => (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {row.getValue("channel")}
          </span>
        ),
      },
      {
        accessorKey: "quota",
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
          <span className="font-medium text-[#22b859]">
            {formatCurrency(row.getValue("quota"))}
          </span>
        ),
      },
      {
        accessorKey: "current",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Corriente (COP)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-[#ff6600]">
            {formatCurrency(row.getValue("current"))}
          </span>
        ),
      },
      {
        accessorKey: "overdue",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Vencida (COP)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const value = row.getValue("overdue") as number
          return (
            <span
              className={cn("font-medium", value > 0 && "text-destructive")}
            >
              {formatCurrency(value)}
            </span>
          )
        },
      },
      {
        accessorKey: "overcapacity",
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
          const value = row.getValue("overcapacity") as number
          return (
            <span className={cn("font-medium", value > 0 && "text-destructive")}>
              {formatCurrency(value)}
            </span>
          )
        },
      },
      {
        accessorKey: "maxDaysOverdue",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4"
          >
            Días Máx Vencido
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const days = row.getValue("maxDaysOverdue") as number
          return (
            <span
              className={cn(
                "font-medium",
                days > 70 && "text-destructive font-bold",
                days > 50 && days <= 70 && "text-amber-600 dark:text-amber-400"
              )}
            >
              {days > 0 ? `${days} días` : "-"}
            </span>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const status = row.getValue("status") as keyof typeof statusConfig
          const config = statusConfig[status]
          return (
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", config.color)} />
              <span className={cn("text-sm", config.textColor)}>
                {config.label}
              </span>
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewClient(row.original)}
              className="h-8"
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              Ver
            </Button>
          </div>
        ),
      },
    ],
    [onViewClient]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="bg-muted/50">
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
              const client = row.original
              const isOverdue90 = client.maxDaysOverdue > 90
              const isNewlyOverdue = client.isNew

              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    isOverdue90 && "bg-red-50/50 dark:bg-red-950/20",
                    isNewlyOverdue &&
                      !isOverdue90 &&
                      "bg-amber-50/50 dark:bg-amber-950/20"
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
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No se encontraron resultados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length > 0
            ? `Mostrando ${
                table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                1
              }-${Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )} de ${table.getFilteredRowModel().rows.length} clientes`
            : "Mostrando 0 de 0 clientes"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
