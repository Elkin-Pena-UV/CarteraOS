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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Filter, X, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const monthOptions = [
  { value: "enero", label: "Enero" },
  { value: "febrero", label: "Febrero" },
  { value: "marzo", label: "Marzo" },
  { value: "abril", label: "Abril" },
  { value: "mayo", label: "Mayo" },
  { value: "junio", label: "Junio" },
  { value: "julio", label: "Julio" },
  { value: "agosto", label: "Agosto" },
  { value: "septiembre", label: "Septiembre" },
  { value: "octubre", label: "Octubre" },
  { value: "noviembre", label: "Noviembre" },
  { value: "diciembre", label: "Diciembre" },
]

const currentYear = String(new Date().getFullYear())
const yearOptions = [
  String(Number(currentYear) - 5),
  String(Number(currentYear) - 4),
  String(Number(currentYear) - 3),
  String(Number(currentYear) - 2),
  String(Number(currentYear) - 1),
  currentYear,
  String(Number(currentYear) + 1),
  String(Number(currentYear) + 2),
]

const periodPresets = [
  { value: "last_3_months", label: "Ultimos 3 meses" },
  { value: "last_6_months", label: "Ultimos 6 meses" },
  { value: "last_12_months", label: "Ultimos 12 meses" },
  { value: "custom", label: "Personalizado" },
] as const

const monthValues = monthOptions.map((month) => month.value)

function formatMonthLabel(month: string) {
  return monthOptions.find((option) => option.value === month)?.label ?? month
}

export function FiltersBarCopy() {
  const { toast } = useToast()
  const [channel, setChannel] = useState<string>("")
  const [clientType, setClientType] = useState<string>("")
  const [clientName, setClientName] = useState<string>("")
  const [periodPreset, setPeriodPreset] = useState<string>("last_12_months")
  const [startMonth, setStartMonth] = useState<string>("octubre")
  const [startYear, setStartYear] = useState<string>(String(Number(currentYear) - 1))
  const [endMonth, setEndMonth] = useState<string>("julio")
  const [endYear, setEndYear] = useState<string>(currentYear)

  const isCustomPeriod = periodPreset === "custom"

  const periodLabel =
    periodPreset === "last_3_months"
      ? "Ultimos 3 meses"
      : periodPreset === "last_6_months"
        ? "Ultimos 6 meses"
        : periodPreset === "last_12_months"
          ? "Ultimos 12 meses"
          : `${formatMonthLabel(startMonth)} ${startYear} - ${formatMonthLabel(endMonth)} ${endYear}`

  const handleApplyFilters = () => {
    toast({
      title: "Filtros aplicados",
      description: `Periodo: ${periodLabel}`,
    })
  }

  const handleClearFilters = () => {
    setChannel("")
    setClientName("")
    setClientType("")
    setPeriodPreset("last_12_months")
    setStartMonth("octubre")
    setStartYear(String(Number(currentYear) - 1))
    setEndMonth("julio")
    setEndYear(currentYear)
    toast({
      title: "Filtros limpiados",
      description: "Se han removido todos los filtros.",
    })
  }

  const handleExportExcel = () => {
    toast({
      title: "Enviando reporte",
      description: "El reporte se enviará en unos segundos...",
    })
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Periodo */}
        <div className="min-w-[220px] space-y-1.5">
          <Label className="text-xs text-muted-foreground">Periodo</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-9 w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {periodLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[580px] p-4" align="start">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Seleccionar periodo</p>
                  <p className="text-xs text-muted-foreground">
                    Usa un preset rápido o define un rango personalizado por mes y año.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Periodo rápido</Label>
                  <Select value={periodPreset} onValueChange={setPeriodPreset}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Seleccionar periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodPresets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isCustomPeriod ? (
                  <div className="space-y-3 rounded-md border p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Desde</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={startMonth} onValueChange={setStartMonth}>
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                              {monthValues.map((month) => (
                                <SelectItem key={month} value={month}>
                                  {formatMonthLabel(month)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={startYear} onValueChange={setStartYear}>
                            <SelectTrigger className="h-9 w-220px">
                              <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                              {yearOptions.map((year) => (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Hasta</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Select value={endMonth} onValueChange={setEndMonth}>
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                              {monthValues.map((month) => (
                                <SelectItem key={month} value={month}>
                                  {formatMonthLabel(month)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={endYear} onValueChange={setEndYear}>
                            <SelectTrigger className="h-9 w-220px">
                              <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                              {yearOptions.map((year) => (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Ejemplo: octubre 2025 a julio 2026.
                    </p>
                  </div>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Canal */}
        <div className="min-w-[160px] space-y-1.5">
          <Label className="text-xs text-muted-foreground">Canal</Label>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="comercializador">Comercializador</SelectItem>
              <SelectItem value="vtd">VTD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de cliente */}
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

        {/* Cliente */}
        <div className="min-w-[180px] space-y-1.5">
          <Label className="text-xs text-muted-foreground">Cliente</Label>
          <Input
            placeholder="Buscar cliente..."
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            onClick={handleApplyFilters}
            className="h-9 bg-[#ff6600] text-white hover:bg-[#e65c00]"
          >
            <Filter className="mr-2 h-4 w-4" />
            Aplicar filtros
          </Button>
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="h-9"
          >
            <X className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="h-9"
          >
            <Mail className="mr-2 h-4 w-4" />
            Enviar reporte
          </Button>
        </div>
      </div>
    </div>
  )
}
