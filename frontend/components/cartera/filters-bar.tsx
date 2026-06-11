"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, X, ChevronDown, ChevronUp } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { ModoFechaCorte } from "@/hooks/use-cartera"

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ClientFilters = {
  channel: string[]
  advisor: string[]
  clientName: string
  minValue: string
  maxValue: string
}

export type FechaCorteState = {
  modo: ModoFechaCorte       // 'hoy' | 'corte' | 'fecha'
  fecha: string | undefined  // 'YYYYMMDD' — solo relevante cuando modo='fecha'
}

export const initialClientFilters: ClientFilters = {
  channel: [],
  advisor: [],
  clientName: "",
  minValue: "",
  maxValue: "",
}

export const initialFechaCorte: FechaCorteState = {
  modo: 'hoy',
  fecha: undefined,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convierte Date → 'YYYYMMDD' */
const toYYYYMMDD = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

/** Convierte 'YYYYMMDD' → Date (para el Calendar) */
const fromYYYYMMDD = (s: string): Date =>
  new Date(
    Number(s.substring(0, 4)),
    Number(s.substring(4, 6)) - 1,
    Number(s.substring(6, 8))
  )

const labelFechaCorte = (estado: FechaCorteState): string => {
  if (estado.modo === 'hoy') return 'Hoy'
  if (estado.fecha) {
    const d = fromYYYYMMDD(estado.fecha)
    return format(d, "dd/MM/yyyy", { locale: es })
  }
  return 'Seleccionar fecha'
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FiltersBarProps {
  value: ClientFilters
  onChange: (nextFilters: ClientFilters) => void
  fechaCorte: FechaCorteState
  onFechaCorteChange: (next: FechaCorteState) => void
  asesoresOptions?: string[]
}

function MultiSelectTrigger({ selected, placeholder }: { selected: string[]; placeholder: string }) {
  if (selected.length === 0) return <span className="text-muted-foreground">{placeholder}</span>
  if (selected.length === 1) return <span>{selected[0]}</span>
  return <span>{selected[0]} <span className="text-muted-foreground">+{selected.length - 1}</span></span>
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function FiltersBar({
  value,
  onChange,
  fechaCorte,
  onFechaCorteChange,
  asesoresOptions = [],
}: FiltersBarProps) {
  const { toast } = useToast()
  const [isExpanded, setIsExpanded] = useState(true)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const updateFilter = <K extends keyof ClientFilters>(key: K, nextValue: ClientFilters[K]) => {
    onChange({ ...value, [key]: nextValue })
  }

  const handleClearFilters = () => {
    onChange(initialClientFilters)
    onFechaCorteChange(initialFechaCorte)
    toast({ title: "Filtros limpiados", description: "Se han removido todos los filtros." })
  }

  // Selección desde el calendario
  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return
    onFechaCorteChange({ modo: 'fecha', fecha: toYYYYMMDD(day) })
    setCalendarOpen(false)
  }

  return (
    <div className="sticky top-16 z-20 rounded-lg border bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {/* Header */}
      <div className={cn("flex items-center justify-between gap-3", isExpanded ? "border-b px-4 py-3" : "px-3 py-2")}>
        <div>
          <p className="text-sm font-semibold">Filtros de cartera</p>
          {!isExpanded && (
            <p className="text-xs text-muted-foreground">
              Corte: <span className="font-medium">{labelFechaCorte(fechaCorte)}</span>
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(v => !v)}
          className={cn("gap-2", isExpanded ? "h-9 px-3" : "h-8 px-2 text-xs")}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {isExpanded ? "Minimizar" : "Desplegar"}
        </Button>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="p-4">
          <div className="flex flex-wrap items-end gap-3">

            {/* ── Fecha de corte ─────────────────────────────────────────── */}
            <div className="min-w-[220px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fecha de corte</Label>
              <div className="flex gap-1.5">
                {/* Botón Hoy */}
                <Button
                  variant={fechaCorte.modo === 'hoy' ? 'default' : 'outline'}
                  className="h-9 px-3 text-xs"
                  onClick={() => onFechaCorteChange({ modo: 'hoy', fecha: undefined })}
                >
                  Hoy
                </Button>

                {/* DatePicker — fecha libre */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={fechaCorte.modo === 'fecha' ? 'default' : 'outline'}
                      className={cn(
                        "h-9 justify-start text-left font-normal",
                        fechaCorte.modo !== 'fecha' && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaCorte.modo === 'fecha' && fechaCorte.fecha
                        ? format(fromYYYYMMDD(fechaCorte.fecha), "dd/MM/yyyy", { locale: es })
                        : "Elegir día"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaCorte.fecha ? fromYYYYMMDD(fechaCorte.fecha) : undefined}
                      onSelect={handleDaySelect}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* ── Canal ──────────────────────────────────────────────────── */}
            <div className="min-w-[140px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Canal</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 w-full justify-between font-normal">
                    <MultiSelectTrigger selected={value.channel} placeholder="Todos" />
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="start">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Canal</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {["Industrial", "Comercializador", "Venta Directa"].map((canal) => (
                    <DropdownMenuCheckboxItem
                      key={canal}
                      checked={value.channel.includes(canal)}
                      onCheckedChange={(checked) =>
                        updateFilter("channel", checked
                          ? [...value.channel, canal]
                          : value.channel.filter((c) => c !== canal)
                        )
                      }
                      onSelect={(e) => e.preventDefault()}
                    >
                      {canal}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* ── Asesor ─────────────────────────────────────────────────── */}
            <div className="min-w-[140px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Asesor</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 w-full justify-between font-normal">
                    <MultiSelectTrigger selected={value.advisor} placeholder="Todos" />
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="start">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Asesor</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {asesoresOptions.length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">Cargando asesores...</p>
                  )}
                  {asesoresOptions.map((asesor) => (
                    <DropdownMenuCheckboxItem
                      key={asesor}
                      checked={value.advisor.includes(asesor)}
                      onCheckedChange={(checked) =>
                        updateFilter("advisor", checked
                          ? [...value.advisor, asesor]
                          : value.advisor.filter((a) => a !== asesor)
                        )
                      }
                      onSelect={(e) => e.preventDefault()}
                    >
                      {asesor}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* ── Nombre / NIT ────────────────────────────────────────────── */}
            <div className="min-w-[140px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nombre o NIT</Label>
              <Input
                placeholder="Buscar..."
                value={value.clientName}
                onChange={(e) => updateFilter("clientName", e.target.value)}
                className="h-9"
              />
            </div>
            {/* ── Acciones ────────────────────────────────────────────────── */}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" onClick={handleClearFilters} className="h-9">
                <X className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
