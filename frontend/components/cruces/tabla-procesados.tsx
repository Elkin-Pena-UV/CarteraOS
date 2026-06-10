"use client"

import { useMemo, forwardRef, useImperativeHandle } from "react"
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
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTableState } from "@/hooks/use-table-state"
import { formatCurrency } from "@/lib/formatters"
import type { FilaCruceAuto } from "@/lib/adapters/crucesAdapter"
import type { CasoCruce } from "@/lib/services/crucesService"

// ── Constantes ────────────────────────────────────────────────────────────────
const NON_HIDEABLE: string[] = []
const VISIBILITY_STORAGE_KEY = 'cruces_procesados_column_visibility'
const STORAGE_KEY = 'cruces_procesados_column_order'
const PINNED_START = ['tercero', 'claveValor']
const STICKY_COLS = ['claveValor']
const PINNED_END: string[] = []

const DEFAULT_COLUMN_ORDER = [
  'tercero', 'razonSocial', 'claveValor', 'caso', 'confianza',
  'totalFVE', 'totalRC', 'net',
  'consecsFVE', 'consecsRC', 'requiereAjuste',
]

// ── Ref ───────────────────────────────────────────────────────────────────────
export interface TablaProcesadosRef {
  table: TanstackTable<FilaCruceAuto>
}

// ── Badges ────────────────────────────────────────────────────────────────────
const CASO_META: Record<CasoCruce, { label: string; class: string }> = {
  MATCH_PERFECTO:  { label: 'Match perfecto',  class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  PAGO_PARCIAL:    { label: 'Pago parcial',     class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  SALDO_A_FAVOR:   { label: 'Saldo a favor',    class: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  SALDO_EN_CONTRA: { label: 'Saldo en contra',  class: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  CREDITO_A_FAVOR: { label: 'Crédito a favor',  class: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
}

function CasoBadge({ caso }: { caso: CasoCruce }) {
  const m = CASO_META[caso] ?? { label: caso, class: 'bg-muted text-muted-foreground border-border' }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${m.class}`}>
      {m.label}
    </span>
  )
}

function ConfianzaBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 90 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-400' : 'bg-rose-500'
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  )
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

function DragOverlayContent({ columnId, columns }: { columnId: string; columns: ColumnDef<FilaCruceAuto>[] }) {
  const col = columns.find(c => c.id === columnId || (c as any).accessorKey === columnId)
  const label = (typeof col?.header === 'string' ? col.header : null) ?? columnId
  return (
    <div className="flex items-center gap-2 rounded-md border border-[#ff6600] bg-[#ff6600]/20 px-3 py-2 font-semibold text-[#ff6600] shadow-md">
      <GripVertical className="h-4 w-4" />{label}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
interface TablaProcesadosProps {
  data: FilaCruceAuto[]
  globalFilter: string
}

export const TablaProcesados = forwardRef<TablaProcesadosRef, TablaProcesadosProps>(
  function TablaProcesados({ data, globalFilter }, ref) {

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

  const columns: ColumnDef<FilaCruceAuto>[] = useMemo(() => [
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
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#ff6600]/20 text-[#ff6600] border border-[#ff6600]/30">
            {row.original.claveType}
          </span>
          <span className="font-mono text-sm">{row.getValue("claveValor")}</span>
        </div>
      ),
    },
    {
      id: "caso",
      accessorKey: "caso",
      header: "Caso",
      size: 150,
      cell: ({ row }) => <CasoBadge caso={row.getValue("caso")} />,
    },
    {
      id: "confianza",
      accessorKey: "confianza",
      header: "Confianza",
      size: 140,
      cell: ({ row }) => <ConfianzaBar value={row.getValue("confianza")} />,
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
      id: "net",
      accessorKey: "net",
      header: "Residual",
      size: 130,
      cell: ({ row }) => {
        const v = row.getValue("net") as number
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
      id: "requiereAjuste",
      accessorKey: "requiereAjuste",
      header: "Ajuste",
      size: 120,
      enableResizing: false,
      cell: ({ row }) =>
        row.getValue("requiereAjuste") ? (
          <AlertCircle className="h-4 w-4 text-amber-400 mx-auto" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-500/50 mx-auto" />
        ),
    },
  ], [])

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between border-b py-2 px-4">
        <CardTitle>Cruces Automáticos</CardTitle>
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
              <TooltipContent><p>Restablecer orden, tamaño y visibilidad de columnas</p></TooltipContent>
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
                    <TableRow key={row.id}>
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
                      Sin cruces automáticos.
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
        <div className="px-4 py-2 border-t text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} de {data.length} cruces
        </div>
      </CardContent>
    </Card>
  )
})
