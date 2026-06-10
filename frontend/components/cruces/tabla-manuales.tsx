"use client"

import { useMemo, forwardRef, useImperativeHandle } from "react"
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
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type Table as TanstackTable,
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
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  GripVertical,
  RotateCcw,
  Columns,
  ShieldCheck,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTableState } from "@/hooks/use-table-state"
import { formatCurrency } from "@/lib/formatters"
import type { FilaGrupoManual } from "@/lib/adapters/crucesAdapter"

// ── Constantes ────────────────────────────────────────────────────────────────
const NON_HIDEABLE: string[] = []
const VISIBILITY_STORAGE_KEY = 'cruces_manuales_column_visibility'
const STORAGE_KEY = 'cruces_manuales_column_order'
const PINNED_START = ['tercero', 'claveValor']
const STICKY_COLS = ['claveValor']
const PINNED_END: string[] = ['accion']

const DEFAULT_COLUMN_ORDER = [
  'tercero', 'razonSocial', 'claveValor', 'confianza', 'nroDocs',
  'totalFVE', 'totalRC', 'netEstimado',
  'consecsFVE', 'consecsRC', 'motivoManual', 'accion',
]

export interface TablaManualesRef {
  table: TanstackTable<FilaGrupoManual>
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
  id, isPinned = false, stickyLeft, label, size,
  isResizing, isResizable = true, onResizeStart, column,
}: DraggableHeaderProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: isPinned })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: size,
    ...(isPinned && stickyLeft !== undefined
      ? { position: "sticky", left: stickyLeft, zIndex: 3 }
      : { position: "relative" }),
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        'group whitespace-nowrap overflow-hidden',
        isDragging && 'bg-[repeating-linear-gradient(-45deg,transparent,transparent_5px,hsl(var(--border))_5px,hsl(var(--border))_6px)] opacity-50',
        isPinned && "bg-background shadow-[2px_0_4px_-2px_rgba(0,0,0,0.15)]"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
        <div className="flex shrink-0 items-center gap-0.5">
          {column?.getCanSort() && (
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
                'opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-muted focus:outline-none',
                column.getIsSorted() && '!opacity-100 text-[#ff6600]'
              )}
              title="Ordenar"
            >
              {column.getIsSorted() === "desc" ? <ArrowDown className="h-3.5 w-3.5" />
                : column.getIsSorted() === "asc" ? <ArrowUp className="h-3.5 w-3.5" />
                : <ArrowUpDown className="h-3.5 w-3.5" />}
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
        />
      )}
    </TableHead>
  )
}

function DragOverlayContent({ columnId, columns }: { columnId: string; columns: ColumnDef<FilaGrupoManual>[] }) {
  const col = columns.find(c => c.id === columnId || (c as any).accessorKey === columnId)
  const label = (typeof col?.header === 'string' ? col.header : null) ?? columnId
  return (
    <div className="flex items-center gap-2 rounded-md border border-[#ff6600] bg-[#ff6600]/20 px-3 py-2 font-semibold text-[#ff6600] shadow-md">
      <GripVertical className="h-4 w-4" />{label}
    </div>
  )
}

function ConfianzaBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-amber-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
interface TablaManualesProps {
  data: FilaGrupoManual[]
  globalFilter: string
  onAutorizar?: (fila: FilaGrupoManual) => void
  autorizados?: Set<string>
  autorizandoIds?: Set<string>
}

export const TablaManuales = forwardRef<TablaManualesRef, TablaManualesProps>(
  function TablaManuales({ data, globalFilter, onAutorizar, autorizados, autorizandoIds }, ref) {

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

  const columns: ColumnDef<FilaGrupoManual>[] = useMemo(() => [
    {
      id: "tercero",
      accessorKey: "tercero",
      header: "Tercero",
      size: 120,
      cell: ({ row }) => <span className="font-mono text-sm">{row.getValue("tercero")}</span>,
    },
    {
      id: "razonSocial",
      accessorKey: "razonSocial",
      header: "Razón Social",
      size: 220,
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("razonSocial") || "—"}</span>
      ),
    },
    {
      id: "claveValor",
      accessorKey: "claveValor",
      header: "Llave",
      size: 160,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {row.original.claveType}
          </span>
          <span className="font-mono text-sm">{row.getValue("claveValor")}</span>
        </div>
      ),
    },
    {
      id: "confianza",
      accessorKey: "confianza",
      header: "Confianza",
      size: 150,
      cell: ({ row }) => <ConfianzaBar value={row.getValue("confianza")} />,
    },
    {
      id: "nroDocs",
      accessorKey: "nroDocs",
      header: "# Docs",
      size: 80,
      cell: ({ row }) => (
        <span className="tabular-nums text-center block">{row.getValue("nroDocs")}</span>
      ),
    },
    {
      id: "totalFVE",
      accessorKey: "totalFVE",
      header: "Total FVE",
      size: 140,
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">{formatCurrency(row.getValue("totalFVE"))}</span>
      ),
    },
    {
      id: "totalRC",
      accessorKey: "totalRC",
      header: "Total RC",
      size: 140,
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">{formatCurrency(Math.abs(row.getValue("totalRC")))}</span>
      ),
    },
    {
      id: "netEstimado",
      accessorKey: "netEstimado",
      header: "Residual est.",
      size: 140,
      cell: ({ row }) => {
        const v = row.getValue("netEstimado") as number
        return (
          <span className={cn(
            "font-medium tabular-nums",
            v === 0 ? "text-muted-foreground" : v > 0 ? "text-rose-500" : "text-sky-500"
          )}>
            {v === 0 ? "—" : formatCurrency(v)}
          </span>
        )
      },
    },
    {
      id: "consecsFVE",
      accessorKey: "consecsFVE",
      header: "Consecs. FVE",
      size: 160,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.getValue("consecsFVE") || "—"}</span>
      ),
    },
    {
      id: "consecsRC",
      accessorKey: "consecsRC",
      header: "Consecs. RC",
      size: 160,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.getValue("consecsRC") || "—"}</span>
      ),
    },
    {
      id: "motivoManual",
      accessorKey: "motivoManual",
      header: "Motivo",
      size: 240,
      cell: ({ row }) => (
        <span className="text-sm text-amber-500">{row.getValue("motivoManual")}</span>
      ),
    },
    {
      id: "accion",
      header: "Acción",
      size: 130,
      enableSorting: false,
      enableResizing: false,
      enableHiding: false,
      cell: ({ row }) => {
        const fila = row.original
        const estaAutorizando = autorizandoIds?.has(fila.id)

        if (autorizados?.has(fila.id)) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
              <ShieldCheck className="h-3 w-3" />
              Autorizado ✓
            </span>
          )
        }
        if (!onAutorizar) return null
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAutorizar(fila)}
            disabled={estaAutorizando}
            className="h-7 text-xs gap-1"
          >
            {estaAutorizando
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <ShieldCheck className="h-3.5 w-3.5" />
            }
            {estaAutorizando ? 'Enviando…' : 'Autorizar'}
          </Button>
        )
      },
    },
  ], [onAutorizar, autorizados, autorizandoIds])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnOrder, columnSizing, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: () => {},
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: "onChange",
    enableColumnPinning: true,
    initialState: {
      columnPinning: { left: ['tercero', 'claveValor'] },
    },
  })

  useImperativeHandle(ref, () => ({ table }), [table])

  return (
    <Card className="border-amber-500/20">
      <CardHeader className="flex flex-row items-center justify-between border-b border-amber-500/20 py-2 px-4 bg-amber-500/5">
        <CardTitle>Requieren Intervención Manual</CardTitle>
        <TooltipProvider>
          <div className="flex items-center">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm"><Columns className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Mostrar / ocultar columnas</p></TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Columnas visibles
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table.getAllColumns()
                  .filter(col => !NON_HIDEABLE.includes(col.id) && col.getCanHide())
                  .map(col => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={col.getIsVisible()}
                      onCheckedChange={v => col.toggleVisibility(!!v)}
                      onSelect={e => e.preventDefault()}
                      className="capitalize"
                    >
                      {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={resetTableState}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Restablecer columnas</p></TooltipContent>
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
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    <SortableContext items={draggableOrder} strategy={horizontalListSortingStrategy}>
                      {(() => {
                        let stickyOffset = 0
                        return headerGroup.headers.map(header => {
                          const isPinned = PINNED_START.includes(header.id) || PINNED_END.includes(header.id)
                          const isSticky = STICKY_COLS.includes(header.id)
                          const currentOffset = isSticky ? stickyOffset : undefined
                          if (isSticky) stickyOffset += header.getSize()
                          const label = typeof header.column.columnDef.header === "string"
                            ? header.column.columnDef.header : header.id
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
                              column={header.column.getCanSort() ? {
                                toggleSorting: d => header.column.toggleSorting(d),
                                getIsSorted: () => header.column.getIsSorted(),
                                getCanSort: () => header.column.getCanSort(),
                                clearSorting: () => header.column.clearSorting(),
                              } : undefined}
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
                  table.getRowModel().rows.map(row => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "hover:bg-amber-500/5",
                        autorizados?.has(row.original.id) && "opacity-50"
                      )}
                    >
                      {(() => {
                        let stickyOffset = 0
                        return row.getVisibleCells().map(cell => {
                          const isSticky = STICKY_COLS.includes(cell.column.id)
                          const currentOffset = isSticky ? stickyOffset : undefined
                          if (isSticky) stickyOffset += cell.column.getSize()
                          return (
                            <TableCell
                              key={cell.id}
                              style={{
                                width: cell.column.getSize(),
                                overflow: "hidden",
                                ...(isSticky && currentOffset !== undefined
                                  ? { position: "sticky", left: currentOffset, zIndex: 2 }
                                  : {}),
                              }}
                              className={cn(isSticky && "bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.2)]")}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          )
                        })
                      })()}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      Sin grupos que requieran intervención.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DragOverlay>
            {activeId ? <DragOverlayContent columnId={activeId} columns={columns} /> : null}
          </DragOverlay>
        </DndContext>
        <div className="px-4 py-2 border-t border-amber-500/20 text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} de {data.length} grupos pendientes
        </div>
      </CardContent>
    </Card>
  )
})
