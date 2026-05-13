"use client"

import { useState, useEffect, useCallback } from "react"
import {
  type SortingState,
  type ColumnSizingState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useToast } from "@/hooks/use-toast"

// Re-exportamos los tipos de TanStack para que los consumidores no tengan
// que importarlos directamente (opcional, pero conveniente).
export type { SortingState, ColumnSizingState, VisibilityState }

interface UseTableStateOptions {
  /** Clave de localStorage para el orden de columnas */
  orderStorageKey: string
  /** Clave de localStorage para la visibilidad de columnas */
  visibilityStorageKey: string
  /** Orden por defecto de las columnas (IDs) */
  defaultOrder: string[]
  /** Columnas que no pueden ocultarse */
  nonHideable?: string[]
  /** Columnas fijas al inicio (no arrastrables) */
  pinnedStart?: string[]
  /** Columnas fijas al final (no arrastrables) */
  pinnedEnd?: string[]
}

interface UseTableStateReturn {
  // ── Estado de TanStack Table ──────────────────────────────────────────────
  sorting: SortingState
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>
  columnOrder: string[]
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>
  columnSizing: ColumnSizingState
  setColumnSizing: React.Dispatch<React.SetStateAction<ColumnSizingState>>
  columnVisibility: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>

  // ── DnD ───────────────────────────────────────────────────────────────────
  activeId: string | null
  sensors: ReturnType<typeof useSensors>
  draggableOrder: string[]
  handleDragStart: (event: DragStartEvent) => void
  handleDragEnd: (event: DragEndEvent) => void

  // ── Acciones ──────────────────────────────────────────────────────────────
  resetTableState: () => void
}

export function useTableState({
  orderStorageKey,
  visibilityStorageKey,
  defaultOrder,
  pinnedStart = [],
  pinnedEnd = [],
}: UseTableStateOptions): UseTableStateReturn {
  const { toast } = useToast()

  // ── Sorting ───────────────────────────────────────────────────────────────
  const [sorting, setSorting] = useState<SortingState>([])

  // ── DnD active ────────────────────────────────────────────────────────────
  const [activeId, setActiveId] = useState<string | null>(null)

  // ── Column sizing ─────────────────────────────────────────────────────────
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  // ── Column visibility — inicializa desde localStorage ─────────────────────
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === "undefined") return {}
    try {
      const saved = localStorage.getItem(visibilityStorageKey)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Persiste visibilidad cada vez que cambia
  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(visibilityStorageKey, JSON.stringify(columnVisibility))
  }, [columnVisibility, visibilityStorageKey])

  // ── Column order — inicializa desde localStorage ──────────────────────────
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") return defaultOrder
    try {
      const saved = localStorage.getItem(orderStorageKey)
      if (saved) {
        const parsed: string[] = JSON.parse(saved)
        // Valida que el orden guardado y el default tengan exactamente las
        // mismas columnas (sin columnas nuevas ni eliminadas).
        const valid =
          parsed.length === defaultOrder.length &&
          defaultOrder.every((col) => parsed.includes(col)) &&
          parsed.every((col) => defaultOrder.includes(col))
        if (valid) return parsed
      }
    } catch {
      /* JSON inválido → usar default */
    }
    return defaultOrder
  })

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetTableState = useCallback(() => {
    setColumnOrder(defaultOrder)
    setColumnSizing({})
    setColumnVisibility({})
    if (typeof window !== "undefined") {
      localStorage.removeItem(orderStorageKey)
      localStorage.removeItem(visibilityStorageKey)
    }
    toast({
      description: "Orden, tamaño y visibilidad de columnas restablecidos",
      duration: 2000,
    })
  }, [defaultOrder, orderStorageKey, visibilityStorageKey, toast])

  // ── DnD sensors ───────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Columnas que el usuario puede arrastrar (excluye pinned)
  const draggableOrder = columnOrder.filter(
    (id) => !pinnedStart.includes(id) && !pinnedEnd.includes(id)
  )

  // ── DnD handlers ──────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over || active.id === over.id) return

      const oldIndex = draggableOrder.indexOf(active.id as string)
      const newIndex = draggableOrder.indexOf(over.id as string)

      if (oldIndex === -1 || newIndex === -1) return

      const newDraggableOrder = arrayMove(draggableOrder, oldIndex, newIndex)
      const newFullOrder = [...pinnedStart, ...newDraggableOrder, ...pinnedEnd]

      setColumnOrder(newFullOrder)

      if (typeof window !== "undefined") {
        localStorage.setItem(orderStorageKey, JSON.stringify(newFullOrder))
      }

      toast({ description: "Columna reordenada", duration: 2000 })
    },
    [draggableOrder, pinnedStart, pinnedEnd, orderStorageKey, toast]
  )

  return {
    sorting,
    setSorting,
    columnOrder,
    setColumnOrder,
    columnSizing,
    setColumnSizing,
    columnVisibility,
    setColumnVisibility,
    activeId,
    sensors,
    draggableOrder,
    handleDragStart,
    handleDragEnd,
    resetTableState,
  }
}