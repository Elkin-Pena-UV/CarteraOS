"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Filter, Mail, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { RotacionFiltros } from "@/lib/services/rotacionService"

// ── Helpers de fecha ──────────────────────────────────────────────────────────

const monthOptions = [
  { value: "enero",      label: "Enero",      num: 1  },
  { value: "febrero",    label: "Febrero",    num: 2  },
  { value: "marzo",      label: "Marzo",      num: 3  },
  { value: "abril",      label: "Abril",      num: 4  },
  { value: "mayo",       label: "Mayo",       num: 5  },
  { value: "junio",      label: "Junio",      num: 6  },
  { value: "julio",      label: "Julio",      num: 7  },
  { value: "agosto",     label: "Agosto",     num: 8  },
  { value: "septiembre", label: "Septiembre", num: 9  },
  { value: "octubre",    label: "Octubre",    num: 10 },
  { value: "noviembre",  label: "Noviembre",  num: 11 },
  { value: "diciembre",  label: "Diciembre",  num: 12 },
]

const currentYear  = String(new Date().getFullYear())
const yearOptions  = Array.from({ length: 8 }, (_, i) =>
  String(Number(currentYear) - 5 + i)
)

const CANAL_OPTIONS = [
  { value: "industrial",      label: "Industrial"      },
  { value: "comercializador", label: "Comercializador" },
  { value: "vtd",             label: "VTD"             },
]

/** Último día del mes seleccionado → YYYYMMDD */
function endOfMonthYYYYMMDD(monthName: string, year: string): string {
  const monthIndex = monthOptions.findIndex((m) => m.value === monthName)
  if (monthIndex === -1) return ""
  const d   = new Date(Number(year), monthIndex + 1, 0)
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

function formatMonthLabel(month: string) {
  return monthOptions.find((o) => o.value === month)?.label ?? month
}

// ── Valores iniciales (mes anterior al actual) ────────────────────────────────

const mesAnterior    = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
const initialMonth   = monthOptions[mesAnterior.getMonth()].value
const initialYear    = String(mesAnterior.getFullYear())

// ── Props ─────────────────────────────────────────────────────────────────────

interface FiltersBarCopyProps {
  onConsultar: (fechaRef: string, filtros: RotacionFiltros) => void
  onLimpiar:   () => void
  isFetching?: boolean
}

// ── Componente ────────────────────────────────────────────────────────────────

export function FiltersBarCopy({ onConsultar, onLimpiar, isFetching = false }: FiltersBarCopyProps) {
  const { toast } = useToast()
  const [isExpanded, setIsExpanded] = useState(true)

  // Periodo
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth)
  const [selectedYear,  setSelectedYear]  = useState<string>(initialYear)

  // Filtros
  const [selectedCanales, setSelectedCanales] = useState<string[]>([])
  const [clientType,      setClientType]      = useState<string>("")
  const [clientName,      setClientName]      = useState<string>("")

  const periodLabel = `${formatMonthLabel(selectedMonth)} ${selectedYear}`

  // ── Toggle canal (selección múltiple) ────────────────────────────────────
  const toggleCanal = (value: string) => {
    setSelectedCanales((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    )
  }

  // ── Aplicar filtros ───────────────────────────────────────────────────────
  const handleApplyFilters = () => {
    const fechaRef = endOfMonthYYYYMMDD(selectedMonth, selectedYear)
    if (!fechaRef) {
      toast({ title: "Fecha inválida", description: "Revisa el mes y año seleccionados.", variant: "destructive" })
      return
    }

    const filtros: RotacionFiltros = {
      canal:       selectedCanales,
      condPago:    clientType && clientType !== "all" ? [clientType] : [],
      razonSocial: clientName,
    }

    onConsultar(fechaRef, filtros)
    toast({ title: "Filtros aplicados", description: `Corte: ${periodLabel} (ref: ${fechaRef})` })
  }

  // ── Limpiar filtros ───────────────────────────────────────────────────────
  const handleClearFilters = () => {
    setSelectedMonth(initialMonth)
    setSelectedYear(initialYear)
    setSelectedCanales([])
    setClientType("")
    setClientName("")
    onLimpiar()
    toast({ title: "Filtros limpiados", description: "Se han removido todos los filtros." })
  }

  const handleExportExcel = () => {
    toast({ title: "Enviando reporte", description: "El reporte se enviará en unos segundos..." })
  }

  return (
    <div className="sticky top-17 z-20 rounded-lg border bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Filtros de rotación</p>
          {isExpanded && (
            <p className="text-xs text-muted-foreground">Periodo actual: {periodLabel}</p>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={() => setIsExpanded((v) => !v)}
          className={cn("gap-2", isExpanded ? "h-9 px-3" : "h-8 px-2 text-xs")}
        >
          {isExpanded
            ? <ChevronUp className="h-4 w-4" />
            : <ChevronDown className="h-3.5 w-3.5" />}
          {isExpanded ? "Minimizar" : "Desplegar"}
        </Button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-4">
          <div className="flex flex-wrap items-end gap-3">

            {/* ── Mes + Año ──────────────────────────────────────────────── */}
            <div className="flex items-end gap-1">
              <div className="min-w-[130px] space-y-1.5">
                <Label className="text-xs text-muted-foreground">Mes</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[110px] space-y-1.5">
                <Label className="text-xs text-muted-foreground">Año</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Botón Consultar ────────────────────────────────────────── */}
            <div className="space-y-1.5">
              <Label className="text-xs text-transparent select-none">‎</Label>
              <Button
                onClick={handleApplyFilters}
                disabled={isFetching}
                className="h-9 bg-[#ff6600] text-white hover:bg-[#e65c00]"
              >
                {isFetching
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Filter className="mr-2 h-4 w-4" />
                }
                {isFetching ? "Cargando..." : "Consultar"}
              </Button>
            </div>

            {/* Separador visual */}
            <div className="h-9 w-px self-end bg-border" />

            {/* ── Canal (selección múltiple con badges) ──────────────────── */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Canal</Label>
              <div className="flex items-center gap-1.5">
                {CANAL_OPTIONS.map(({ value, label }) => {
                  const isSelected = selectedCanales.includes(value)
                  return (
                    <Badge
                      key={value}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => toggleCanal(value)}
                      className={cn(
                        "h-9 cursor-pointer select-none px-3 text-xs transition-colors",
                        isSelected
                          ? "bg-[#ff6600] text-white hover:bg-[#e65c00] border-transparent"
                          : "hover:bg-muted"
                      )}
                    >
                      {label}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {/* ── Tipo de cliente ────────────────────────────────────────── */}
            <div className="min-w-[160px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo de cliente</Label>
              <Select value={clientType} onValueChange={setClientType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                  <SelectItem value="anticipado">Anticipado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Cliente ────────────────────────────────────────────────── */}
            <div className="min-w-[180px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cliente</Label>
              <Input
                placeholder="Buscar cliente..."
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-9"
              />
            </div>

            {/* ── Acciones ───────────────────────────────────────────────── */}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" onClick={handleClearFilters} className="h-9">
                <X className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
              <Button variant="outline" onClick={handleExportExcel} className="h-9">
                <Mail className="mr-2 h-4 w-4" />
                Enviar reporte
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}