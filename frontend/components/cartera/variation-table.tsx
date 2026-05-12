"use client"

import { useEffect, useState, useMemo } from "react"
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
  type VisibilityState,
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
import { useToast } from '@/hooks/use-toast'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  GripVertical,
  RotateCcw,
  Columns,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

const mockVariationData: VariationClient[] = [
  {
    id: "1",
    nit: "900123456-1",
    razonSocial: "Comercializadora ABC S.A.S.",
    tipoCliente: "Mayorista",
    canal: "Directo",
    viaje: 12500000,
    cupo: 500000000,
    carteraMesActual: 620000000,
    carteraUltimoMes: 480000000,
    variacionCop: 140000000,
    variacionPct: 29.17,
    sobrecupoCop: 120000000,
  },
  {
    id: "2",
    nit: "800987654-2",
    razonSocial: "Distribuidora del Norte Ltda.",
    tipoCliente: "Minorista",
    canal: "Distribuidor",
    viaje: 8000000,
    cupo: 300000000,
    carteraMesActual: 280000000,
    carteraUltimoMes: 320000000,
    variacionCop: -40000000,
    variacionPct: -12.5,
    sobrecupoCop: 0,
  },
  {
    id: "3",
    nit: "901234567-3",
    razonSocial: "Inversiones XYZ S.A.",
    tipoCliente: "Corporativo",
    canal: "Directo",
    viaje: 18000000,
    cupo: 800000000,
    carteraMesActual: 1050000000,
    carteraUltimoMes: 750000000,
    variacionCop: 300000000,
    variacionPct: 40,
    sobrecupoCop: 250000000,
  },
  {
    id: "4",
    nit: "890456789-4",
    razonSocial: "Grupo Empresarial del Caribe",
    tipoCliente: "Mayorista",
    canal: "Agente",
    viaje: 22000000,
    cupo: 450000000,
    carteraMesActual: 720000000,
    carteraUltimoMes: 400000000,
    variacionCop: 320000000,
    variacionPct: 80,
    sobrecupoCop: 270000000,
  },
  {
    id: "5",
    nit: "800111222-5",
    razonSocial: "Almacenes Unidos S.A.",
    tipoCliente: "Minorista",
    canal: "Distribuidor",
    viaje: 6500000,
    cupo: 250000000,
    carteraMesActual: 180000000,
    carteraUltimoMes: 220000000,
    variacionCop: -40000000,
    variacionPct: -18.18,
    sobrecupoCop: 0,
  },
  {
    id: "6",
    nit: "901555666-6",
    razonSocial: "Suministros Industriales Ltda.",
    tipoCliente: "Corporativo",
    canal: "Directo",
    viaje: 9000000,
    cupo: 600000000,
    carteraMesActual: 550000000,
    carteraUltimoMes: 480000000,
    variacionCop: 70000000,
    variacionPct: 14.58,
    sobrecupoCop: 0,
  },
  {
    id: "7",
    nit: "800777888-7",
    razonSocial: "Ferretería Central S.A.S.",
    tipoCliente: "Minorista",
    canal: "Agente",
    viaje: 15000000,
    cupo: 200000000,
    carteraMesActual: 350000000,
    carteraUltimoMes: 190000000,
    variacionCop: 160000000,
    variacionPct: 84.21,
    sobrecupoCop: 150000000,
  },
  {
    id: "8",
    nit: "890999000-8",
    razonSocial: "Textiles del Pacífico S.A.",
    tipoCliente: "Mayorista",
    canal: "Distribuidor",
    viaje: 11000000,
    cupo: 400000000,
    carteraMesActual: 380000000,
    carteraUltimoMes: 410000000,
    variacionCop: -30000000,
    variacionPct: -7.32,
    sobrecupoCop: 0,
  },
  {
    id: "9",
    nit: "901888999-9",
    razonSocial: "Importadora Global Ltda.",
    tipoCliente: "Corporativo",
    canal: "Directo",
    viaje: 14000000,
    cupo: 700000000,
    carteraMesActual: 680000000,
    carteraUltimoMes: 550000000,
    variacionCop: 130000000,
    variacionPct: 23.64,
    sobrecupoCop: 0,
  },
  {
    id: "10",
    nit: "800333444-0",
    razonSocial: "Químicos del Valle S.A.",
    tipoCliente: "Mayorista",
    canal: "Agente",
    viaje: 7500000,
    cupo: 350000000,
    carteraMesActual: 420000000,
    carteraUltimoMes: 380000000,
    variacionCop: 40000000,
    variacionPct: 10.53,
    sobrecupoCop: 70000000,
  },
]

const NON_HIDEABLE = ['nit']
const VISIBILITY_STORAGE_KEY = 'cartera_variation_column_visibility'
const STORAGE_KEY = 'cartera_variation_column_order'
const PINNED_START = ['nit']
const PINNED_END: string[] = []

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

const formatPercent = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`

// ---------------------------------------------------------------------------
// DraggableHeader
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
  } = useSortable({ id, disabled: isPinned })

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

      {!isPinned && (
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

export function VariationTable() {
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
            'nit', 'razonSocial', 'tipoCliente', 'canal', 'cupo',
            'carteraMesActual', 'carteraUltimoMes',
            'variacionCop', 'variacionPct', 'viaje', 'sobrecupoCop',
          ]
          const valid =
            defaultColumns.every((col) => parsed.includes(col)) &&
            parsed.every((col: string) => defaultColumns.includes(col))
          if (valid) return parsed
        } catch { /* Invalid JSON, use default */ }
      }
    }
    return [
      'nit', 'razonSocial', 'tipoCliente', 'canal', 'cupo',
      'carteraMesActual', 'carteraUltimoMes',
      'variacionCop', 'variacionPct', 'viaje', 'sobrecupoCop',
    ]
  })
  const { toast } = useToast()

  const [currentMonth, setCurrentMonth] = useState("")

  useEffect(() => {
    setCurrentMonth(
      new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" })
    )
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(columnVisibility))
    }
  }, [columnVisibility])

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
        size: 130,
        cell: ({ row }) => (
          <span className="text-sm">{row.getValue("canal")}</span>
        ),
      },
      {
        id: "cupo",
        accessorKey: "cupo",
        header: "Cupo (COP)",
        size: 150,
        cell: ({ row }) => (
          <span className="font-medium text-[#22b859]">
            {formatCurrency(row.getValue("cupo"))}
          </span>
        ),
      },
      {
        id: "carteraMesActual",
        accessorKey: "carteraMesActual",
        header: "Cartera Mes Actual (COP)",
        size: 250,
        cell: ({ row }) => (
          <span className="font-medium text-[#ff6600]">
            {formatCurrency(row.getValue("carteraMesActual"))}
          </span>
        ),
      },
      {
        id: "carteraUltimoMes",
        accessorKey: "carteraUltimoMes",
        header: "Cartera Último Mes (COP)",
        size: 250,
        cell: ({ row }) => (
          <span className="font-medium text-muted-foreground">
            {formatCurrency(row.getValue("carteraUltimoMes"))}
          </span>
        ),
      },
      {
        id: "variacionCop",
        accessorKey: "variacionCop",
        header: "Variación COP",
        size: 160,
        cell: ({ row }) => {
          const value = row.getValue("variacionCop") as number
          const isPositive = value >= 0
          return (
            <span
              className={cn(
                "flex items-center gap-1 font-medium",
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
        id: "variacionPct",
        accessorKey: "variacionPct",
        header: "Variación %",
        size: 150,
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
        id: "viaje",
        accessorKey: "viaje",
        header: "Viaje (COP)",
        size: 160,
        cell: ({ row }) => (
          <span className="font-medium text-muted-foreground">
            {formatCurrency(row.getValue("viaje"))}
          </span>
        ),
      },
      {
        id: "sobrecupoCop",
        accessorKey: "sobrecupoCop",
        header: "Sobrecupo (COP)",
        size: 180,
        cell: ({ row }) => {
          const value = row.getValue("sobrecupoCop") as number
          return (
            <span
              className={cn(
                "font-medium",
                value > 0 ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {formatCurrency(value)}
            </span>
          )
        },
      },
    ],
    []
  )

  const defaultColumnOrder = columns.map((col) => col.id as string)

  const table = useReactTable({
    data: mockVariationData,
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
    state: { sorting, columnOrder, columnSizing, columnVisibility },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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
        toast({ description: 'Columna reordenada', duration: 2000 })
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b py-2 px-4">
          <div className="flex items-center gap-3">
            <CardTitle>Variación de Cartera — Mes Actual vs Anterior</CardTitle>
            <Badge
              variant="outline"
              className="border-[#ff6600] text-[#ff6600] capitalize"
            >
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
                  <Button variant="ghost" size="sm" onClick={resetColumnOrder}>
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
          {/* Table */}
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
                      const hasSobrecupo = row.original.sobrecupoCop > 0
                      return (
                        <TableRow
                          key={row.id}
                          className={cn(hasSobrecupo && "bg-red-50/50 dark:bg-red-950/20")}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              style={{ width: cell.column.getSize(), overflow: "hidden" }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
