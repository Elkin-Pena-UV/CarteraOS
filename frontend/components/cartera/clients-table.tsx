"use client"

import { useState, useMemo, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnSizingState,
  type VisibilityState
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
import {
  Eye,
  ArrowUpDown,
  GripVertical,
  RotateCcw,
  ArrowDown,
  ArrowUp,
  Columns,        // ← NUEVO
  Check,          // ← NUEVO
} from 'lucide-react'
// Agrega estas importaciones de componentes UI:
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { cn } from "@/lib/utils"
import type { ClientFilters } from "./filters-bar"

export type Client = {
  nit: string
  name: string
  advisor: string
  paymentCondition: string
  channel: string
  quota: number
  current: number
  overdue1: number
  overdue2: number
  overdue3: number
  overdue4: number
  overdue: number
  totalBalance: number
  totalCop: number
  overcapacity: number
  maxDaysOverdue: number
  dueDate: string
  remittanceValue: number
  remittanceWeight: number
  remittanceDocuments: number
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


const NON_HIDEABLE = ['nit', 'actions']
const VISIBILITY_STORAGE_KEY = 'cartera_general_column_visibility'
const STORAGE_KEY = 'cartera_general_column_order'
const PINNED_START = ['nit']
const PINNED_END = ['actions']

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(value)
}

interface ClientsTableProps {
  data: Client[]
  onViewClient: (client: Client) => void
  filters: ClientFilters
}

// ---------------------------------------------------------------------------
// DraggableHeader — texto a la izquierda, botones (sort + grip) a la derecha
// ---------------------------------------------------------------------------
interface DraggableHeaderProps {
  id: string
  isPinned?: boolean
  label: string
  size: number
  isResizing: boolean
  onResizeStart: (e: React.MouseEvent | React.TouchEvent) => void
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
  size,
  isResizing,
  onResizeStart,
  column,
}: DraggableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: isPinned,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: size,
    position: "relative",
  }

  const canSort = column?.getCanSort() ?? false

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        'group whitespace-nowrap overflow-hidden',
        isDragging &&
        'bg-[repeating-linear-gradient(-45deg,transparent,transparent_5px,hsl(var(--border))_5px,hsl(var(--border))_6px)] opacity-50'
      )}
    >
      {/* Contenedor principal: texto izquierda, acciones derecha */}
      <div className="flex items-center justify-between gap-1">

        {/* Texto del header */}
        <span className="text-sm font-medium text-foreground truncate">
          {label}
        </span>

        {/* Acciones a la derecha: botón sort + grip drag */}
        <div className="flex shrink-0 items-center gap-0.5">

          {/* Botón de ordenar — solo si la columna puede ordenarse */}
          {canSort && column && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const sorted = column.getIsSorted()
                if (sorted === false) {
                  column.toggleSorting(true)
                } else if (sorted === "desc") {
                  column.toggleSorting(false)
                } else {
                  column.clearSorting()
                }
              }}
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded transition-all duration-150',
                'opacity-0 group-hover:opacity-60 hover:!opacity-100',
                'hover:bg-muted focus:outline-none',
                column.getIsSorted() && '!opacity-100 text-[#ff6600]'
              )}
              title="Ordenar"
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

          {/* Grip de drag — solo en columnas no fijadas */}
          {!isPinned && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              aria-label="Arrastrar columna"
              className={cn(
                'flex h-6 w-5 items-center justify-center rounded transition-all duration-150',
                'opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-[#ff6600]',
                'cursor-grab active:cursor-grabbing focus:outline-none'
              )}
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Handle de resize ── */}
      {!isPinned && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation()
            onResizeStart(e)
          }}
          onTouchStart={(e) => {
            e.stopPropagation()
            onResizeStart(e)
          }}
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

function DragOverlayContent({ columnId, columns }: { columnId: string; columns: ColumnDef<Client>[] }) {
  const column = columns.find(col => col.id === columnId || (col as { accessorKey?: string }).accessorKey === columnId)
  const label = (typeof column?.header === 'string' ? column.header : null) ?? columnId

  return (
    <div className="flex items-center gap-2 rounded-md border border-[#ff6600] bg-[#ff6600]/20 px-3 py-2 font-semibold text-[#ff6600] shadow-md">
      <GripVertical className="h-4 w-4" />
      {label}
    </div>
  )
}

export function ClientsTable({ data, onViewClient, filters }: ClientsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(VISIBILITY_STORAGE_KEY)
      if (saved) {
        try { return JSON.parse(saved) } catch { /* usa default */ }
      }
    }
    return {}
  })
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const defaultColumns = [
            'nit',
            'name',
            'channel',
            'paymentCondition',
            'quota',
            'current',
            'overdue',
            'overdue1',
            'overdue2',
            'overdue3',
            'overdue4',
            'overcapacity',
            'maxDaysOverdue',
            'totalBalance',
            'totalCop',
            'remittanceValue',
            'status',
            'actions',
          ]
          const valid =
            defaultColumns.every((col) => parsed.includes(col)) &&
            parsed.every((col: string) => defaultColumns.includes(col))
          if (valid) return parsed
        } catch {
          // Invalid JSON, use default
        }
      }
    }

    return [
      'nit',
      'name',
      'channel',
      'paymentCondition',
      'quota',
      'current',
      'overdue',
      'overdue1',
      'overdue2',
      'overdue3',
      'overdue4',
      'overcapacity',
      'maxDaysOverdue',
      'totalBalance',
      'totalCop',
      'remittanceValue',
      'status',
      'actions',
    ]
  })
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(columnVisibility))
    }
  }, [columnVisibility])

  const filteredData = useMemo(() => {
    const normalizedClientName = filters.clientName.trim().toLowerCase()
    const normalizedClientQueryNoPunct = normalizedClientName.replace(/[^a-z0-9]/gi, "")
    const normalizedAdvisor = filters.advisor.toLowerCase()
    const normalizedStatus = filters.status.toLowerCase()
    const normalizedChannel = filters.channel.toLowerCase()

    const minValue = filters.minValue === "" ? null : Number(filters.minValue)
    const maxValue = filters.maxValue === "" ? null : Number(filters.maxValue)

    const fromDate = filters.dateRange?.from
      ? new Date(filters.dateRange.from)
      : null
    const toDate = filters.dateRange?.to
      ? new Date(filters.dateRange.to)
      : null

    if (fromDate) {
      fromDate.setHours(0, 0, 0, 0)
    }

    if (toDate) {
      toDate.setHours(23, 59, 59, 999)
    }

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

      if (normalizedClientName) {
        const nameMatches = client.name.toLowerCase().includes(normalizedClientName)
        const nitNormalized = client.nit ?
          client.nit.toLowerCase().replace(/[^a-z0-9]/gi, "") : ""
        const nitMatches = nitNormalized.includes(normalizedClientQueryNoPunct)
        if (!nameMatches && !nitMatches) {
          return false
        }
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

  // ---------------------------------------------------------------------------
  // Definición de columnas
  // ---------------------------------------------------------------------------
  const columns: ColumnDef<Client>[] = useMemo(
    () => [
      {
        id: "nit",
        accessorKey: "nit",
        header: "NIT",
        size: 120,
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.getValue("nit")}</span>
        ),
      },
      {
        id: "name",
        accessorKey: "name",
        header: "Nombre Cliente",
        size: 200,
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("name")}</span>
        ),
      },
      {
        id: "channel",
        accessorKey: "channel",
        header: "Canal",
        size: 160,
        cell: ({ row }) => (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {row.getValue("channel")}
          </span>
        ),
      },
      {
        id: "paymentCondition",
        accessorKey: "paymentCondition",
        header: "Cond. pago",
        size: 120,
        cell: ({ row }) => (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {row.getValue("paymentCondition")}
          </span>
        ),
      },
      {
        id: "quota",
        accessorKey: "quota",
        header: "Cupo (COP)",
        size: 140,
        cell: ({ row }) => (
          <span className="font-medium text-[#22b859]">
            {formatCurrency(row.getValue("quota"))}
          </span>
        ),
      },
      {
        id: "current",
        accessorKey: "current",
        header: "Corriente (COP)",
        size: 150,
        cell: ({ row }) => (
          <span className="font-medium text-[#ff6600]">
            {formatCurrency(row.getValue("current"))}
          </span>
        ),
      },
      {
        id: "overdue",
        accessorKey: "overdue",
        header: "Vencida (COP)",
        size: 160,
        cell: ({ row }) => {
          const value = row.getValue("overdue") as number
          return (
            <span className={cn("font-medium", value > 0 && "text-destructive")}>
              {formatCurrency(value)}
            </span>
          )
        },
      },
      {
        id: "overdue1",
        accessorKey: "overdue1",
        header: "Venc. 1-30",
        size: 150,
        cell: ({ row }) => {
          const value = row.getValue("overdue1") as number
          return (
            <span className={cn("font-medium", value > 0 && "text-amber-600")}>
              {formatCurrency(value)}
            </span>
          )
        },
      },
      {
        id: "overdue2",
        accessorKey: "overdue2",
        header: "Venc. 31-60",
        size: 150,
        cell: ({ row }) => {
          const value = row.getValue("overdue2") as number
          return (
            <span className={cn("font-medium", value > 0 && "text-orange-600")}>
              {formatCurrency(value)}
            </span>
          )
        },
      },
      {
        id: "overdue3",
        accessorKey: "overdue3",
        header: "Venc. 61-90",
        size: 150,
        cell: ({ row }) => {
          const value = row.getValue("overdue3") as number
          return (
            <span className={cn("font-medium", value > 0 && "text-red-500")}>
              {formatCurrency(value)}
            </span>
          )
        },
      },
      {
        id: "overdue4",
        accessorKey: "overdue4",
        header: "+90 días",
        size: 150,
        cell: ({ row }) => {
          const value = row.getValue("overdue4") as number
          return (
            <span className={cn("font-medium", value > 0 && "text-destructive")}>
              {formatCurrency(value)}
            </span>
          )
        },
      },
      {
        id: "overcapacity",
        accessorKey: "overcapacity",
        header: "Sobrecupo (COP)",
        size: 150,
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
        id: "maxDaysOverdue",
        accessorKey: "maxDaysOverdue",
        header: "Días Máx Vencido",
        size: 150,
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
        id: "totalBalance",
        accessorKey: "totalBalance",
        header: "Saldo total",
        size: 140,
        cell: ({ row }) => {
          const value = row.getValue("totalBalance") as number
          return <span className="font-medium">{formatCurrency(value)}</span>
        },
      },
      {
        id: "totalCop",
        accessorKey: "totalCop",
        header: "Total COP",
        size: 140,
        cell: ({ row }) => {
          const value = row.getValue("totalCop") as number
          return <span className="font-medium">{formatCurrency(value)}</span>
        },
      },
      {
        id: "remittanceValue",
        accessorKey: "remittanceValue",
        header: "Valor remisión COP",
        size: 160,
        cell: ({ row }) => {
          const value = row.getValue("remittanceValue") as number
          return <span className="font-medium">{formatCurrency(value)}</span>
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Estado",
        size: 120,
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
        size: 100,
        enableResizing: false,
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

  const defaultColumnOrder = columns.map(col => col.id as string)

  const table = useReactTable({
    data: filteredData,
    columns,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    enableSortingRemoval: true,
    sortDescFirst: true,
    state: {
      sorting,
      columnOrder,
      columnSizing,
      columnVisibility,
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const draggableOrder = columnOrder.filter(
    (id) => !PINNED_START.includes(id) && !PINNED_END.includes(id)
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = draggableOrder.indexOf(active.id as string)
      const newIndex = draggableOrder.indexOf(over.id as string)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newDraggableOrder = arrayMove(draggableOrder, oldIndex, newIndex)
        const newFullOrder = [...PINNED_START, ...newDraggableOrder, ...PINNED_END]

        setColumnOrder(newFullOrder)

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newFullOrder))
        }

        toast({
          description: 'Columna reordenada',
          duration: 2000,
        })
      }
    }
  }

  const resetColumnOrder = () => {
    setColumnOrder(defaultColumnOrder)
    setColumnSizing({})
    setColumnVisibility({})
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(VISIBILITY_STORAGE_KEY)
    }
    toast({
      description: 'Orden, tamaño y visibilidad de columnas restablecidos',
      duration: 2000,
    })
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-end border-b px-4 py-2">
        <TooltipProvider>
          <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Columns className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mostrar / ocultar columnas</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Columnas visibles
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {table
            .getAllColumns()
            .filter(col => !NON_HIDEABLE.includes(col.id) && col.getCanHide())
            .map(col => {
              const label =
                typeof col.columnDef.header === 'string'
                  ? col.columnDef.header
                  : col.id
              return (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={value => col.toggleVisibility(!!value)}
                  onSelect={e => e.preventDefault()}
                  className="capitalize"
                >
                  {label}
                </DropdownMenuCheckboxItem>
              )
            })}
        </DropdownMenuContent>
      </DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={resetColumnOrder}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Restablecer orden, tamaño y visibilidad de columnas</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Table style={{ tableLayout: "fixed", width: table.getTotalSize() }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <SortableContext
                  items={draggableOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {headerGroup.headers.map((header) => {
                    const isPinned =
                      PINNED_START.includes(header.id) ||
                      PINNED_END.includes(header.id)

                    const label =
                      typeof header.column.columnDef.header === "string"
                        ? header.column.columnDef.header
                        : header.id

                    return (
                      <DraggableHeader
                        key={header.id}
                        id={header.id}
                        isPinned={isPinned}
                        label={label}
                        size={header.getSize()}
                        isResizing={header.column.getIsResizing()}
                        onResizeStart={header.getResizeHandler()}
                        column={
                          header.column.getCanSort()
                            ? {
                              toggleSorting: (desc) =>
                                header.column.toggleSorting(desc),
                              getIsSorted: () => header.column.getIsSorted(),
                              getCanSort: () => header.column.getCanSort(),
                              clearSorting: () => header.column.clearSorting(),
                            }
                            : undefined
                        }
                      />
                    )
                  })}
                </SortableContext>
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
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize(), overflow: "hidden" }}
                      >
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
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <DragOverlay>
          {activeId ? (
            <DragOverlayContent columnId={activeId} columns={columns} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
