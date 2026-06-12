"use client"

import { forwardRef, useEffect, useImperativeHandle, useMemo } from "react"
import {
  DndContext,
  closestCenter,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
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
  type Table as TanstackTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  GripVertical,
  RotateCcw,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns,
} from 'lucide-react'
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
import { cn } from "@/lib/utils"
import { useTableState } from "@/hooks/use-table-state"
import { formatCurrency } from "@/lib/formatters"
import type { ClientFilters } from "./filters-bar"

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type Client = {
  nit: string
  name: string
  advisors: string[]
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
  isNew?: boolean
}

// ── Constantes ────────────────────────────────────────────────────────────────
const NON_HIDEABLE = ['actions']
const VISIBILITY_STORAGE_KEY = 'cartera_general_column_visibility'
const STORAGE_KEY = 'cartera_general_column_order'
const PINNED_START = ['nit', 'name']
const STICKY_COLS = ['name']
const PINNED_END = ['actions']

const DEFAULT_COLUMN_ORDER = [
  'nit', 'name', 'channel', 'paymentCondition', 'quota',
  'current', 'overdue1', 'overdue2', 'overdue3', 'overdue4', 'overdue',
  'overcapacity', 'maxDaysOverdue', 'totalBalance', 'totalCop',
  'remittanceValue', 'actions',
]

// ── Props ─────────────────────────────────────────────────────────────────────
interface ClientsTableProps {
  data: Client[]
  onViewClient: (client: Client) => void
  onSortedRowsChange?: (rows: Client[]) => void
}

export interface ClientsTableRef {
  table: TanstackTable<Client>
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
    toggleSortingWithEvent: (e: React.MouseEvent) => void
    getIsSorted: () => false | "desc" | "asc"
    getCanSort: () => boolean
    clearSorting: () => void
    getSortIndex: () => number
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
        isPinned && "bg-background shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]"
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
                column.toggleSortingWithEvent(e)
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
              {column.getIsSorted() && (
                <span className="text-[10px] font-bold leading-none">
                  {column.getSortIndex() + 1}
                </span>
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

// ── Componente principal ──────────────────────────────────────────────────────
const ClientsTable = forwardRef<ClientsTableRef, ClientsTableProps>(
  ({ data, onViewClient, onSortedRowsChange }, ref) => {

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

  // ── Columnas ──────────────────────────────────────────────────────────────
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
        header: "Cond. Pago",
        size: 145,
        cell: ({ row }) => (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            {row.getValue("paymentCondition")}
          </span>
        ),
      },
      {
        id: "quota",
        accessorKey: "quota",
        header: "Cupo",
        size: 140,
        cell: ({ row }) => {
          const value = row.getValue("quota") as number
          return <span className="font-medium text-[#22b859]">{formatCurrency(value)}</span>
        },
      },
      {
        id: "current",
        accessorKey: "current",
        header: "Saldo Corriente",
        size: 170,
        cell: ({ row }) => {
          const value = row.getValue("current") as number
          return <span className="font-medium text-[#ff6600]">{formatCurrency(value)}</span>
        },
      },
      {
        id: "overdue1",
        accessorKey: "overdue1",
        header: "Vencido 1-30",
        size: 155,
        cell: ({ row }) => {
          const value = row.getValue("overdue1") as number
          return (
            <span className={cn("font-medium", value > 0 && "text-red-500")}>
              {formatCurrency(value)}
            </span>
          )
        },
      },
      {
        id: "overdue2",
        accessorKey: "overdue2",
        header: "Vencido 31-60",
        size: 165,
        cell: ({ row }) => {
          const value = row.getValue("overdue2") as number
          return (
            <span className={cn("font-medium", value > 0 && "text-red-500")}>
              {formatCurrency(value)}
            </span>
          )
        },
      },
      {
        id: "overdue3",
        accessorKey: "overdue3",
        header: "Vencido 61-90",
        size: 165,
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
        header: "Vencido +90",
        size: 155,
        cell: ({ row }) => {
          const value = row.getValue("overdue4") as number
          return (
            <span className={cn("font-medium", value > 0 && "text-red-500")}>
              {formatCurrency(value)}
            </span>
          )
        },
      },
      {
        id: "overdue",
        accessorKey: "overdue",
        header: "Total Vencido",
        size: 155,
        cell: ({ row }) => {
          const value = row.getValue("overdue") as number
          return (
            <span className={cn("font-medium", value > 0 && "text-red-700")}>
              {formatCurrency(value)}
            </span>
          )
        },
      },
      {
        id: "overcapacity",
        accessorKey: "overcapacity",
        header: "Sobrecupo",
        size: 145,
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
        id: "totalBalance",
        accessorKey: "totalBalance",
        header: "Saldo Total",
        size: 150,
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
          return <span className="font-medium text-[#22b859]">{formatCurrency(value)}</span>
        },
      },
      {
        id: "remittanceValue",
        accessorKey: "remittanceValue",
        header: "Valor remisión",
        size: 160,
        cell: ({ row }) => {
          const value = row.getValue("remittanceValue") as number
          return <span className="font-medium">{formatCurrency(value)}</span>
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

  // ── TanStack Table ────────────────────────────────────────────────────────
  const table = useReactTable({
    data,
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
    isMultiSortEvent: () => true, 
    maxMultiSortColCount: 3,
    state: { sorting, columnOrder, columnSizing, columnVisibility },
    enableColumnPinning: true,
    initialState: {
      columnPinning: {
        left: ['nit', 'name'],   // clients-table
        // left: ['nit', 'razonSocial'],  // variation-table
      },
    },


  })

  useEffect(() => {
    const sortedRows = table.getSortedRowModel().rows.map(r => r.original)
    onSortedRowsChange?.(sortedRows)
  }, [sorting, data])

  useImperativeHandle(ref, () => ({ table }), [table])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b py-0.1 px-4">
        <CardTitle>Tabla de Clientes</CardTitle>
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
          <Table style={{ tableLayout: "fixed", width: table.getTotalSize() }}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  <SortableContext
                    items={draggableOrder}
                    strategy={horizontalListSortingStrategy}
                  >
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
                                  toggleSortingWithEvent: (e) => header.column.getToggleSortingHandler()?.(e),
                                  getIsSorted: () => header.column.getIsSorted(),
                                  getCanSort: () => header.column.getCanSort(),
                                  clearSorting: () => header.column.clearSorting(),
                                  getSortIndex: () => header.column.getSortIndex()
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
                  const client = row.original
                  const isOverdue90 = client.maxDaysOverdue > 90
                  const isNewlyOverdue = client.isNew

                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        isOverdue90 && "bg-red-50/50 dark:bg-red-950/20",
                        isNewlyOverdue && !isOverdue90 && "bg-amber-50/50 dark:bg-amber-950/20"
                      )}
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
      </CardContent>
    </Card>
  )
  }
)
ClientsTable.displayName = 'ClientsTable'
export { ClientsTable }
