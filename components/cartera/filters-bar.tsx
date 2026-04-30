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
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Download, Filter, X, Mail } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { DateRange } from "react-day-picker"

export function FiltersBar() {
  const { toast } = useToast()
  const [channel, setChannel] = useState<string>("")
  const [advisor, setAdvisor] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [nit, setNit] = useState<string>("")
  const [minValue, setMinValue] = useState<string>("")
  const [maxValue, setMaxValue] = useState<string>("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const handleApplyFilters = () => {
    toast({
      title: "Filtros aplicados",
      description: "La tabla ha sido actualizada con los filtros seleccionados.",
    })
  }

  const handleClearFilters = () => {
    setChannel("")
    setAdvisor("")
    setStatus("")
    setNit("")
    setMinValue("")
    setMaxValue("")
    setDateRange(undefined)
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
        {/* Canal */}
        <div className="min-w-[140px] space-y-1.5">
          <Label className="text-xs text-muted-foreground">Canal</Label>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="comercializador">Comercializador</SelectItem>
              <SelectItem value="vtd">Venta Directa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Asesor */}
        <div className="min-w-[140px] space-y-1.5">
          <Label className="text-xs text-muted-foreground">Asesor</Label>
          <Select value={advisor} onValueChange={setAdvisor}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="carlos">Carlos Méndez</SelectItem>
              <SelectItem value="maria">María González</SelectItem>
              <SelectItem value="pedro">Pedro Ramírez</SelectItem>
              <SelectItem value="laura">Laura Torres</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Estado */}
        <div className="min-w-[140px] space-y-1.5">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="corriente">Corriente</SelectItem>
              <SelectItem value="vencida">Vencida</SelectItem>
              <SelectItem value="gestion">En gestión</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="min-w-[220px] space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Fecha Vencimiento
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy", { locale: es })} -{" "}
                      {format(dateRange.to, "dd/MM/yy", { locale: es })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: es })
                  )
                ) : (
                  "Seleccionar rango"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* NIT */}
        <div className="min-w-[140px] space-y-1.5">
          <Label className="text-xs text-muted-foreground">NIT Cliente</Label>
          <Input
            placeholder="Buscar NIT..."
            value={nit}
            onChange={(e) => setNit(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Rango de Valor */}
        <div className="min-w-[180px] space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Rango Valor (COP)
          </Label>
          <div className="flex items-center gap-1">
            <Input
              placeholder="Min"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="h-9 w-20"
              type="number"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              placeholder="Max"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              className="h-9 w-20"
              type="number"
            />
          </div>
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
