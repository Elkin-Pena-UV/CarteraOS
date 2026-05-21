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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

const currentYear = String(new Date().getFullYear())
const yearOptions = Array.from({ length: 8 }, (_, i) =>
  String(Number(currentYear) - 5 + i)
)

// Valores que el backend busca con .includes(value.toLowerCase())
// sobre el campo f1_canal ("01 - COMERCIALIZADOR", "02 - INDUSTRIAL", etc.)
const CANAL_OPTIONS = [
  { value: "comercializador", label: "Comercializador" },
  { value: "industrial",      label: "Industrial"      },
  { value: "vtd",             label: "VTD"             },
]

/** Último día del mes seleccionado → YYYYMMDD */
function endOfMonthYYYYMMDD(monthName: string, year: string): string {
  const monthIndex = monthOptions.findIndex((m) => m.value === monthName)
  if (monthIndex === -1) return ""
  const d = new Date(Number(year), monthIndex + 1, 0)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

function formatMonthLabel(month: string) {
  return monthOptions.find((o) => o.value === month)?.label ?? month
}

// ── Helper label del multi-select de canal ────────────────────────────────────
function CanalTriggerLabel({ selected }: { selected: string[] }) {
  if (selected.length === 0) return <span className="text-muted-foreground">Todos</span>
  if (selected.length === 1) {
    return <span>{CANAL_OPTIONS.find(o => o.value === selected[0])?.label ?? selected[0]}</span>
  }
  return (
    <span>
      {CANAL_OPTIONS.find(o => o.value === selected[0])?.label ?? selected[0]}
      {" "}<span className="text-muted-foreground">+{selected.length - 1}</span>
    </span>
  )
}

// ── Valores iniciales (mes anterior al actual) ────────────────────────────────

const mesAnterior  = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
const initialMonth = monthOptions[mesAnterior.getMonth()].value
const initialYear  = String(mesAnterior.getFullYear())

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
  const [selectedMonth,   setSelectedMonth]   = useState<string>(initialMonth)
  const [selectedYear,    setSelectedYear]    = useState<string>(initialYear)

  // Filtros
  const [selectedCanales, setSelectedCanales] = useState<string[]>([])
  const [clientType,      setClientType]      = useState<string>("")
  const [clientName,      setClientName]      = useState<string>("")

  const periodLabel = `${formatMonthLabel(selectedMonth)} ${selectedYear}`

  // ── Aplicar filtros ───────────────────────────────────────────────────────
  const handleApplyFilters = () => {
    const fechaRef = endOfMonthYYYYMMDD(selectedMonth, selectedYear)
    if (!fechaRef) {
      toast({ title: "Fecha inválida", description: "Revisa el mes y año seleccionados.", variant: "destructive" })
      return
    }

    const filtros: RotacionFiltros = {
      canal:       selectedCanales,
      // "Credito" / "Anticipado" con mayúscula — coincide exactamente con f1_cond_pago_tipo
      condPago:    clientType && clientType !== "all" ? [clientType] : [],
      razonSocial: clientName.trim(),
    }

    onConsultar(fechaRef, filtros)
    toast({ title: "Filtros aplicados", description: `Corte: ${periodLabel}` })
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
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-3.5 w-3.5" />}
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

            {/* ── Canal (multi-select) ───────────────────────────────────── */}
            <div className="min-w-[170px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Canal</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 w-full justify-between font-normal">
                    <CanalTriggerLabel selected={selectedCanales} />
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="start">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Canal</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {CANAL_OPTIONS.map(({ value, label }) => (
                    <DropdownMenuCheckboxItem
                      key={value}
                      checked={selectedCanales.includes(value)}
                      onCheckedChange={(checked) =>
                        setSelectedCanales((prev) =>
                          checked ? [...prev, value] : prev.filter((c) => c !== value)
                        )
                      }
                      onSelect={(e) => e.preventDefault()}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* ── Condición de pago ──────────────────────────────────────── */}
            <div className="min-w-[160px] space-y-1.5">
              <Label className="text-xs text-muted-foreground">Condición de pago</Label>
              <Select value={clientType} onValueChange={setClientType}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {/* Mayúscula inicial — coincide exactamente con f1_cond_pago_tipo */}
                  <SelectItem value="Credito">Crédito</SelectItem>
                  <SelectItem value="Anticipado">Anticipado</SelectItem>
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
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
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