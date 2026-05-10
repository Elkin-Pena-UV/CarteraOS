"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PaginationControlsProps {
  page: number
  pages: number
  total: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
  isLoading?: boolean
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
}

export function PaginationControls({
  page,
  pages,
  total,
  limit,
  hasNext,
  hasPrev,
  isLoading,
  onPageChange,
  onLimitChange,
}: PaginationControlsProps) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="flex flex-col gap-3 px-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      
      {/* Info de registros */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          Mostrando <strong>{from.toLocaleString()}–{to.toLocaleString()}</strong> de{" "}
          <strong>{total.toLocaleString()}</strong>
        </span>

        {/* Selector de cantidad por página (opcional) */}
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Por página:</span>
            <Select
              value={String(limit)}
              onValueChange={(val) => onLimitChange(Number(val))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={!hasPrev || isLoading}
          title="Primera página"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev || isLoading}
          title="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="px-3 text-sm font-medium">
          Página {page} de {pages || 1}
        </span>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext || isLoading}
          title="Siguiente página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(pages)}
          disabled={!hasNext || isLoading}
          title="Última página"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}