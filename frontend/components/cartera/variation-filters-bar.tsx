"use client"

import { useMemo, useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronUp, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface VariationFilters {
  search: string       // NIT o razón social
  tipoCliente: string[]
  canal: string[]
}

export interface VariationPeriod {
  year: number
  month: number        // 1-12
}

export const initialVariationFilters: VariationFilters = {
  search: "",
  tipoCliente: [],
  canal: [],
}

// Mes actual como periodo inicial
export function getInitialVariationPeriod(): VariationPeriod {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const MESES = [
  { value: 1,  label: "Enero"      },
  { value: 2,  label: "Febrero"    },
  { value: 3,  label: "Marzo"      },
  { value: 4,  label: "Abril"      },
  { value: 5,  label: "Mayo"       },
  { value: 6,  label: "Junio"      },
  { value: 7,  label: "Julio"      },
  { value: 8,  label: "Agosto"     },
  { value: 9,  label: "Septiembre" },
  { value: 10, label: "Octubre"    },
  { value: 11, label: "Noviembre"  },
  { value: 12, label: "Diciembre"  },
]

/** Retorna el último día del mes como string YYYYMMDD */
export function lastDayOfMonthYYYYMMDD(year: number, month: number): string {
  const lastDay = new Date(year, month, 0) // día 0 del mes siguiente = último del actual
  const y = lastDay.getFullYear()
  const m = String(lastDay.getMonth() + 1).padStart(2, "0")
  const d = String(lastDay.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}

/** Label legible del periodo seleccionado */
function periodLabel(period: VariationPeriod): string {
  const mes = MESES.find((m) => m.value === period.month)?.label ?? ""
  return `${mes} ${period.year}`
}

// Años disponibles: año actual y los 2 anteriores
function getYears(): number[] {
  const currentYear = new Date().getFullYear()
  return [currentYear - 2, currentYear - 1, currentYear]
}

// ── Helper multi-select trigger ──────────────────────────────────────────────
function MultiSelectTrigger({ selected, placeholder }: { selected: string[], placeholder: string }) {
  if (selected.length === 0) return <span className="text-muted-foreground">{placeholder}</span>
  if (selected.length === 1) return <span className="truncate max-w-[140px]">{selected[0]}</span>
  return (
    <span className="flex items-center gap-1.5">
      <span className="truncate max-w-[100px]">{selected[0]}</span>
      <Badge variant="secondary" className="h-5 px-1.5 text-xs">+{selected.length - 1}</Badge>
    </span>
  )
}

// ── Props ────────────────────────────────────────────────────────────────────
interface VariationFiltersBarProps {
  filters: VariationFilters
  onFiltersChange: (f: VariationFilters) => void
  period: VariationPeriod
  onPeriodChange: (p: VariationPeriod) => void
  onConsultar: () => void
  onClearPeriod?: () => void
}

// ── Componente ───────────────────────────────────────────────────────────────
export function VariationFiltersBar({
  filters,
  onFiltersChange,
  period,
  onPeriodChange,
  onConsultar,
  onClearPeriod,
}: VariationFiltersBarProps) {
  const { toast } = useToast()
  const [isExpanded, setIsExpanded] = useState(true)
  const YEARS = useMemo(() => getYears(), [])

  const update = <K extends keyof VariationFilters>(key: K, val: VariationFilters[K]) =>
    onFiltersChange({ ...filters, [key]: val })

  const handleClear = () => {
    onFiltersChange(initialVariationFilters)
    onClearPeriod?.()
    toast({ title: "Filtros limpiados", description: "Se han removido todos los filtros." })
  }

  return (
    <div className="sticky top-16 z-20 rounded-lg border bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {/* Header */}
      <div className={cn("flex items-center justify-between gap-3", isExpanded ? "border-b px-4 py-3" : "px-3 py-2")}>
        <div>
          <p className="text-sm font-semibold">Filtros de variación</p>
          {!isExpanded && (
            <p className="text-xs text-muted-foreground">
              Periodo: <span className="font-medium">{periodLabel(period)}</span>
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={() => setIsExpanded((v) => !v)}
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

            {/* ── Mes + Año + Consultar ─────────────────────────────────── */}
            <div className="flex items-end gap-1">
              <div className="min-w-[130px] space-y-1.5">
                <Label className="text-xs text-muted-foreground">Mes</Label>
                <Select
                  value={String(period.month)}
                  onValueChange={(v) => onPeriodChange({ ...period, month: Number(v) })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[90px] space-y-1.5">
                <Label className="text-xs text-muted-foreground">Año</Label>
                <Select
                  value={String(period.year)}
                  onValueChange={(v) => onPeriodChange({ ...period, year: Number(v) })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Botón Consultar ──────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label className="text-xs text-transparent select-none">‎</Label>
              <Button
                onClick={onConsultar}
                className="h-9 bg-[#ff6600] text-white hover:bg-[#e65c00]"
              >
                Consultar
              </Button>
            </div>

            {/* Separador visual */}
            <div className="h-9 w-px self-end bg-border" />

            {/* ── NIT / Razón social ───────────────────────────────────── */}
            <div className="min-w-[180px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">NIT o Razón Social</Label>
              <Input
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => update("search", e.target.value)}
                className="h-9"
              />
            </div>

            {/* ── Tipo de cliente ──────────────────────────────────────── */}
            <div className="min-w-[180px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo de cliente</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 w-full justify-between font-normal">
                    <MultiSelectTrigger selected={filters.tipoCliente} placeholder="Todos" />
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="start">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Tipo de cliente</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[
                    "Arquitecto e Ingeniero",
                    "Cliente Nacional",
                    "Concreteros",
                    "Consorcios",
                    "Constructor",
                    "Distribución Mayorista Retail",
                    "Distribuidor Mayorista",
                    "Ferreteria Grande",
                    "Ferreteria Mediana",
                    "Institucional (Ong Fundaciones Colegio I",
                    "Prefabricador",
                    "Venta de Empleados",
                    "Venta Directa",
                  ].map((tipo) => (
                    <DropdownMenuCheckboxItem
                      key={tipo}
                      checked={filters.tipoCliente.includes(tipo)}
                      onCheckedChange={(checked) =>
                        update("tipoCliente", checked
                          ? [...filters.tipoCliente, tipo]
                          : filters.tipoCliente.filter((t) => t !== tipo)
                        )
                      }
                      onSelect={(e) => e.preventDefault()}
                    >
                      {tipo}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* ── Canal ───────────────────────────────────────────────── */}
            <div className="min-w-[160px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Canal</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 w-full justify-between font-normal">
                    <MultiSelectTrigger selected={filters.canal} placeholder="Todos" />
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="start">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Canal</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {["Industrial", "Comercializador", "VTD"].map((canal) => (
                    <DropdownMenuCheckboxItem
                      key={canal}
                      checked={filters.canal.includes(canal)}
                      onCheckedChange={(checked) =>
                        update("canal", checked
                          ? [...filters.canal, canal]
                          : filters.canal.filter((c) => c !== canal)
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

            {/* ── Limpiar ──────────────────────────────────────────────── */}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" onClick={handleClear} className="h-9">
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
