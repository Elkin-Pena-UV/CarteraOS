"use client"

import { useMemo } from "react"
import {
  DndContext,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
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
import {
  TrendingUp,
  TrendingDown,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  GripVertical,
  RotateCcw,
  Columns,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTableState } from "@/hooks/use-table-state"
import { formatCurrency } from "@/lib/formatters"

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface VariationClient {
  id: string
  nit: string
  razonSocial: string
  tipoCliente: string
  canal: string
  viaje: number
  cupo: number
  carteraMesActual: number
  carteraUltimoMes: number
  variacionCop: number
  variacionPct: number
  sobrecupoCop: number
}

// ── Constantes ────────────────────────────────────────────────────────────────
const NON_HIDEABLE = ['nit']
const VISIBILITY_STORAGE_KEY = 'cartera_variation_column_visibility'
const STORAGE_KEY = 'cartera_variation_column_order'
const PINNED_START = ['nit', 'razonSocial']
const STICKY_COLS = ['razonSocial']
const PINNED_END: string[] = []

const DEFAULT_COLUMN_ORDER = [
  'nit', 'razonSocial', 'tipoCliente', 'canal', 'cupo',
  'carteraMesActual', 'carteraUltimoMes',
  'variacionCop', 'variacionPct', 'sobrecupoCop',
]

const formatPercent = (value: number | null | undefined) => {
  if (value == null) return "0.00%"
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface VariationTableProps {
  data: VariationClient[]
  fecha: string
}

// ── DraggableHeader ───────────────────────────────────────────────────────────
interface DraggableHeaderProps {
  id: string
  isPinned?: boolean
  isResizable?: boolean
  stickyLeft?: number
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
  stickyLeft,
  label,
  size,
  isResizing,
  isResizable = true,
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
  } = useSortable({ id, disabled: isPinned })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: size,
    // sticky si aplica:
    ...(isPinned && stickyLeft !== undefined
      ? { position: "sticky", left: stickyLeft, zIndex: 3 }
      : { position: "relative" }),
  }

  const canSort = column?.getCanSort() ?? false

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        'group whitespace-nowrap overflow-hidden',
        isDragging &&
        'bg-[repeating-linear-gradient(-45deg,transparent,transparent_5px,hsl(var(--border))_5px,hsl(var(--border))_6px)] opacity-50',
        isPinned && "bg-muted/40"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-sm font-medium text-foreground truncate">{label}</span>

        <div className="flex shrink-0 items-center gap-0.5">
          {canSort && column && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const sorted = column.getIsSorted()
                if (sorted === false) column.toggleSorting(true)
                else if (sorted === "desc") column.toggleSorting(false)
                else column.clearSorting()
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

      {isResizable && (
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

function DragOverlayContent({
  columnId,
  columns,
}: {
  columnId: string
  columns: ColumnDef<VariationClient>[]
}) {
  const column = columns.find(
    (col) => col.id === columnId || (col as { accessorKey?: string }).accessorKey === columnId
  )
  const label = (typeof column?.header === 'string' ? column.header : null) ?? columnId

  return (
    <div className="flex items-center gap-2 rounded-md border border-[#ff6600] bg-[#ff6600]/20 px-3 py-2 font-semibold text-[#ff6600] shadow-md">
      <GripVertical className="h-4 w-4" />
      {label}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export function VariationTable({ data, fecha }: VariationTableProps) {

  // ── Estado de tabla (hook compartido) ─────────────────────────────────────
  const {
    sorting, setSorting,
    columnOrder, setColumnOrder,
    columnSizing, setColumnSizing,
    columnVisibility, setColumnVisibility,
    activeId, sensors, draggableOrder,
    handleDragStart, handleDragEnd,
    resetTableState,
  } = useTableState({
    orderStorageKey: STORAGE_KEY,
    visibilityStorageKey: VISIBILITY_STORAGE_KEY,
    defaultOrder: DEFAULT_COLUMN_ORDER,
    pinnedStart: PINNED_START,
    pinnedEnd: PINNED_END,
  })

  // ── Mes actual formateado ─────────────────────────────────────────────────
  const currentMonth = useMemo(() => {
    const year = Number(fecha.slice(0, 4))
    const month = Number(fecha.slice(4, 6)) - 1
    return new Date(year, month, 1).toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric",
    })
  }, [fecha])

  // ── Columnas ──────────────────────────────────────────────────────────────
  const columns: ColumnDef<VariationClient>[] = useMemo(
    () => [
      {
        id: "nit",
        accessorKey: "nit",
        header: "NIT",
        size: 130,
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.getValue("nit")}</span>
        ),
      },
      {
        id: "razonSocial",
        accessorKey: "razonSocial",
        header: "Razón Social",
        size: 220,
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("razonSocial")}</span>
        ),
      },
      {
        id: "tipoCliente",
        accessorKey: "tipoCliente",
        header: "Tipo de Cliente",
        size: 170,
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue("tipoCliente")}</span>
        ),
      },
      {
        id: "canal",
        accessorKey: "canal",
        header: "Canal",
        size: 160,
        cell: ({ row }) => (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {row.getValue("canal")}
          </span>
        ),
      },
      {
        id: "cupo",
        accessorKey: "cupo",
        header: "Cupo",
        size: 150,
        cell: ({ row }) => (
          <span className="font-medium text-[#22b859]">{formatCurrency(row.getValue("cupo"))}</span>
        ),
      },
      {
        id: "carteraMesActual",
        accessorKey: "carteraMesActual",
        header: "Cartera Mes",
        size: 180,
        cell: ({ row }) => (
          <span className="font-medium text-[#ff6600]">{formatCurrency(row.getValue("carteraMesActual"))}</span>
        ),
      },
      {
        id: "carteraUltimoMes",
        accessorKey: "carteraUltimoMes",
        header: "Cartera Mes Anterior",
        size: 195,
        cell: ({ row }) => (
          <span className="font-medium text-[#ff6600]">{formatCurrency(row.getValue("carteraUltimoMes"))}</span>
        ),
      },
      {
        id: "variacionCop",
        accessorKey: "variacionCop",
        header: "Variación",
        size: 160,
        cell: ({ row }) => {
          const value = row.getValue("variacionCop") as number
          const isPositive = value > 0
          const isNeutral = value === 0
          return (
            <span className={cn(
              "font-medium",
              isNeutral ? "text-muted-foreground" : isPositive ? "text-red-600" : "text-green-600"
            )}>
              {formatCurrency(value)}
            </span>
          )
        },
      },
      {
        id: "variacionPct",
        accessorKey: "variacionPct",
        header: "Variación (%)",
        size: 150,
        cell: ({ row }) => {
          const value = row.getValue("variacionPct") as number
          const isPositive = value > 0
          const isNeutral = value === 0
          return (
            <span className={cn(
              "flex items-center gap-1 font-medium",
              isNeutral ? "text-muted-foreground" : isPositive ? "text-red-600" : "text-green-600"
            )}>
              {!isNeutral && (isPositive
                ? <TrendingUp className="h-4 w-4" />
                : <TrendingDown className="h-4 w-4" />
              )}
              {formatPercent(value)}
            </span>
          )
        },
      },
      {
        id: "sobrecupoCop",
        accessorKey: "sobrecupoCop",
        header: "Sobrecupo",
        size: 170,
        cell: ({ row }) => {
          const value = row.getValue("sobrecupoCop") as number
          return (
            <span className={cn("font-medium", value > 0 ? "text-red-600" : "text-muted-foreground")}>
              {formatCurrency(value)}
            </span>
          )
        },
      },
    ],
    []
  )

  // ── TanStack Table ────────────────────────────────────────────────────────
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnOrder, columnSizing, columnVisibility },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    enableColumnPinning: true,
    initialState: {
      columnPinning: {
        left: ['nit', 'name'],   // clients-table
        // left: ['nit', 'razonSocial'],  // variation-table
      },
    },
  })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b py-2 px-4">
          <div className="flex items-center gap-3">
            <CardTitle>Variación de Cartera — Mes Actual vs Anterior</CardTitle>
            <Badge variant="outline" className="border-[#ff6600] text-[#ff6600] capitalize">
              {currentMonth}
            </Badge>
          </div>
          <TooltipProvider>
            <div className="flex items-center">
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
                    .filter((col) => !NON_HIDEABLE.includes(col.id) && col.getCanHide())
                    .map((col) => {
                      const label =
                        typeof col.columnDef.header === 'string'
                          ? col.columnDef.header
                          : col.id
                      return (
                        <DropdownMenuCheckboxItem
                          key={col.id}
                          checked={col.getIsVisible()}
                          onCheckedChange={(value) => col.toggleVisibility(!!value)}
                          onSelect={(e) => e.preventDefault()}
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
                  <Button variant="ghost" size="sm" onClick={resetTableState}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Restablecer orden, tamaño y visibilidad de columnas</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardHeader>
        <CardContent className="p-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto">
              <Table style={{ tableLayout: "fixed", width: table.getTotalSize() }}>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      <SortableContext items={draggableOrder} strategy={horizontalListSortingStrategy}>
                        {(() => {
                          let stickyOffset = 0
                          return headerGroup.headers.map((header) => {
                            const isPinned =
                              PINNED_START.includes(header.id) ||
                              PINNED_END.includes(header.id)
                            const isSticky = STICKY_COLS.includes(header.id)
                            const currentOffset = isSticky ? stickyOffset : undefined
                            if (isSticky) stickyOffset += header.getSize()

                            const label =
                              typeof header.column.columnDef.header === "string"
                                ? header.column.columnDef.header
                                : header.id

                            return (
                              <DraggableHeader
                                key={header.id}
                                id={header.id}
                                isPinned={isPinned}
                                isResizable={header.column.getCanResize()}
                                stickyLeft={currentOffset}
                                label={label}
                                size={header.getSize()}
                                isResizing={header.column.getIsResizing()}
                                onResizeStart={header.getResizeHandler()}
                                column={
                                  header.column.getCanSort()
                                    ? {
                                      toggleSorting: (desc) => header.column.toggleSorting(desc),
                                      getIsSorted: () => header.column.getIsSorted(),
                                      getCanSort: () => header.column.getCanSort(),
                                      clearSorting: () => header.column.clearSorting(),
                                    }
                                    : undefined
                                }
                              />
                            )
                          })
                        })()}
                      </SortableContext>
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
                          className={cn(hasSobrecupo && "bg-red-50/50 dark:bg-red-950/20")}
                        >
                          {(() => {
                            let stickyOffset = 0
                            return row.getVisibleCells().map((cell) => {
                              const isStickyCol = STICKY_COLS.includes(cell.column.id)
                              const currentOffset = isStickyCol ? stickyOffset : undefined
                              if (isStickyCol) stickyOffset += cell.column.getSize()
                              return (
                                <TableCell
                                  key={cell.id}
                                  style={{
                                    width: cell.column.getSize(),
                                    overflow: "hidden",
                                    ...(isStickyCol && currentOffset !== undefined
                                      ? { position: "sticky", left: currentOffset, zIndex: 2 }
                                      : {}),
                                  }}
                                  className={cn(isStickyCol && "bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]")}
                                >
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              )
                            })
                          })()}
                        </TableRow>
                      )
                    })
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

            <DragOverlay>
              {activeId ? (
                <DragOverlayContent columnId={activeId} columns={columns} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  )
}
