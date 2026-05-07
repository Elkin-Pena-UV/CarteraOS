'use client'

import * as React from 'react'
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
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableHead } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'

interface DraggableTableHeaderProps {
  columnId: string
  children: React.ReactNode
  isPinned?: boolean
}

export function DraggableTableHeader({ columnId, children, isPinned = false }: DraggableTableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: columnId,
    disabled: isPinned,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  }

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        'group whitespace-nowrap',
        isDragging && 'bg-[repeating-linear-gradient(-45deg,transparent,transparent_5px,hsl(var(--border))_5px,hsl(var(--border))_6px)]'
      )}
    >
      <div className="flex items-center gap-1">
        {!isPinned && (
          <button
            {...attributes}
            {...listeners}
            className={cn(
              'flex h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded opacity-0 transition-opacity duration-150',
              'group-hover:opacity-40 hover:!opacity-100 hover:text-[#ff6600]',
              'active:cursor-grabbing focus:outline-none'
            )}
            tabIndex={-1}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div className={cn(!isPinned && 'transition-transform duration-150')}>
          {children}
        </div>
      </div>
    </TableHead>
  )
}

interface DragOverlayHeaderProps {
  children: React.ReactNode
}

export function DragOverlayHeader({ children }: DragOverlayHeaderProps) {
  return (
    <div className="rounded-md border border-[#ff6600] bg-[#ff6600]/20 px-3 py-2 text-[#ff6600] shadow-md">
      <div className="flex items-center gap-2 font-semibold">
        <GripVertical className="h-4 w-4" />
        {children}
      </div>
    </div>
  )
}

interface DraggableColumnContextProps {
  columnOrder: string[]
  setColumnOrder: (order: string[]) => void
  pinnedColumns?: { start?: string[]; end?: string[] }
  storageKey: string
  defaultOrder: string[]
  children: React.ReactNode
}

export function DraggableColumnContext({
  columnOrder,
  setColumnOrder,
  pinnedColumns = {},
  storageKey,
  defaultOrder,
  children,
}: DraggableColumnContextProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const { toast } = useToast()

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

  const pinnedStart = pinnedColumns.start || []
  const pinnedEnd = pinnedColumns.end || []
  
  // Get draggable columns (excluding pinned)
  const draggableOrder = columnOrder.filter(
    (id) => !pinnedStart.includes(id) && !pinnedEnd.includes(id)
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
        const newFullOrder = [...pinnedStart, ...newDraggableOrder, ...pinnedEnd]
        
        setColumnOrder(newFullOrder)
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(newFullOrder))
        }

        toast({
          description: 'Columna reordenada',
          duration: 2000,
        })
      }
    }
  }

  const activeColumn = columnOrder.find((id) => id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={draggableOrder} strategy={horizontalListSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay>
        {activeId && activeColumn ? (
          <DragOverlayHeader>{activeColumn}</DragOverlayHeader>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export function useColumnOrder(storageKey: string, defaultOrder: string[]) {
  const [columnOrder, setColumnOrder] = React.useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Validate that all default columns exist
          const valid = defaultOrder.every(col => parsed.includes(col)) && 
                       parsed.every((col: string) => defaultOrder.includes(col))
          if (valid) return parsed
        } catch {
          // Invalid JSON, use default
        }
      }
    }
    return defaultOrder
  })

  const resetOrder = React.useCallback(() => {
    setColumnOrder(defaultOrder)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
  }, [storageKey, defaultOrder])

  return { columnOrder, setColumnOrder, resetOrder }
}